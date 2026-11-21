#!/bin/sh
# The chunk with 2 hits is likely the Redis client code
f="/app/.next/server/chunks/[root-of-the-server]__1_hanih._.js"
echo "=== Redis-related lines ==="
grep -oE '.{0,100}getRedis.{0,100}' "$f" 2>/dev/null | head -5
echo "---"
grep -oE '.{0,100}redisClient.{0,100}' "$f" 2>/dev/null | head -5
echo "---"
# Find the new Redis(...) constructor call
grep -oE '.{0,80}new .{0,20}\(.{0,80}' "$f" 2>/dev/null | grep -i 'url\|6379\|connect\|lazy\|retry' | head -5
