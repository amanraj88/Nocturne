import type { NextApiRequest, NextApiResponse } from 'next';
import { isSupabaseConfigured, getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { getServiceRoleClient } from '@/lib/server/supabaseAdmin';
import { roomManager } from '@/lib/server/rooms';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Room ID is required' });
  }

  if (!/^[a-zA-Z0-9_-]{1,120}$/.test(id)) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const { targetUserId, targetSessionId, targetUserName } = req.body || {};
  const targetId = targetUserId || targetSessionId;

  if (!targetId || typeof targetId !== 'string') {
    return res.status(400).json({ error: 'Target user ID is required' });
  }

  // Strict Supabase Mode
  if (isSupabaseConfigured()) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token) {
      return res.status(401).json({ error: 'Authentication required to promote host' });
    }

    const client = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userRes, error: userError } = await client.auth.getUser();
    if (userError || !userRes?.user?.id) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const userId = userRes.user.id;

    // Check room existence and host permissions
    const { data: room, error: roomError } = await client
      .from('rooms')
      .select('id, slug, title, host_id, host_name, is_featured')
      .or(`id.eq.${id},slug.eq.${id},id.eq.room-${id}`)
      .maybeSingle();

    if (roomError || !room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (room.is_featured) {
      return res.status(403).json({ error: 'Editorial featured lounges cannot transfer host ownership.' });
    }

    if (room.host_id !== userId) {
      return res.status(403).json({ error: 'Only the current room host can promote a listener to host.' });
    }

    if (targetId === room.host_id) {
      return res.status(400).json({ error: 'User is already the host of this room.' });
    }

    // Verify target participant is in the room
    const { data: targetMember } = await client
      .from('room_memberships')
      .select('user_id, display_name, role, is_active')
      .eq('room_id', room.id)
      .eq('user_id', targetId)
      .maybeSingle();

    const newHostName = (targetUserName || targetMember?.display_name || 'Listener').trim();

    // Try PostgreSQL RPC function first
    const { data: rpcData, error: rpcError } = await client.rpc('promote_room_host', {
      p_room_id: room.id,
      p_target_user_id: targetId,
      p_target_name: newHostName,
    });

    if (!rpcError && rpcData?.success) {
      return res.status(200).json({
        ok: true,
        success: true,
        newHostId: targetId,
        newHostName,
        previousHostId: userId,
      });
    }

    // Fallback to service_role administrative execution
    const admin = getServiceRoleClient();
    if (!admin) {
      return res.status(500).json({
        error: rpcError ? rpcError.message : 'Database service role client unavailable.',
      });
    }

    const nowIso = new Date().toISOString();

    // 1. Demote old host to listener
    await admin
      .from('room_memberships')
      .update({ role: 'listener', last_seen: nowIso })
      .eq('room_id', room.id)
      .eq('user_id', userId);

    // 2. Promote target listener to host
    const { error: memberError } = await admin
      .from('room_memberships')
      .upsert({
        room_id: room.id,
        user_id: targetId,
        display_name: newHostName,
        role: 'host',
        is_active: true,
        last_seen: nowIso,
      }, { onConflict: 'room_id,user_id' });

    if (memberError) {
      return res.status(500).json({ error: 'Failed to update member role: ' + memberError.message });
    }

    // 3. Atomically update room host in rooms table
    const { error: roomUpdateError } = await admin
      .from('rooms')
      .update({
        host_id: targetId,
        host_name: newHostName,
        updated_at: nowIso,
      })
      .eq('id', room.id);

    if (roomUpdateError) {
      return res.status(500).json({ error: 'Failed to transfer room host: ' + roomUpdateError.message });
    }

    // 4. Insert system chat message
    await admin
      .from('chat_messages')
      .insert({
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        room_id: room.id,
        user_id: targetId,
        user_name: 'NOCTURNE',
        user_role: 'host',
        text: `${newHostName} is now the host`,
        is_system: true,
      });

    return res.status(200).json({
      ok: true,
      success: true,
      newHostId: targetId,
      newHostName,
      previousHostId: userId,
    });
  }

  // In-memory fallback mode for local development
  const state = roomManager.getRoomState(id);
  if (!state) {
    return res.status(404).json({ error: `Room "${id}" not found` });
  }

  const requesterId = (req.body?.requesterId as string) || (req.headers['x-user-id'] as string);
  if (requesterId && state.room.host?.id && state.room.host.id !== requesterId) {
    return res.status(403).json({ error: 'Only the current room host can promote a listener to host.' });
  }

  if (state.room.host?.id === targetId) {
    return res.status(400).json({ error: 'User is already the host of this room.' });
  }

  const success = roomManager.promoteHost(state.room.id, targetId, targetUserName);
  if (!success) {
    return res.status(400).json({ error: 'Failed to promote participant in this room.' });
  }

  return res.status(200).json({
    ok: true,
    success: true,
    newHostId: targetId,
    newHostName: targetUserName || 'Listener',
  });
}
