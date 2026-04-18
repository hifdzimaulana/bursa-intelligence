-- Migration: Create get_market_pulse_stats() RPC function
-- Run this in Supabase SQL Editor
-- 
-- This RPC function moves heavy counting logic to the database to fix:
-- 1. Dashboard lag from multiple client-side queries
-- 2. Incorrect counts (900 entities/5k investors)
-- 
-- Returns: 
--   - total_entities (unique share_code count)
--   - total_investors (unique investor_name count)
--   - investor_type_distribution (grouped by investor_type)
--   - top_concentrated_issuers (where tracked ownership >1% is highest)
--   - data_quality (total/valid/invalid counts)
--   - top_holders (top 10 by percentage)
--   - invalid_rows (latest 10 invalid records)

CREATE OR REPLACE FUNCTION get_market_pulse_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  total_entities_count BIGINT;
  total_investors_count BIGINT;
  investor_type_dist JSONB;
  top_concentrated JSONB;
  data_quality JSONB;
  top_holders JSONB;
  invalid_rows_data JSONB;
BEGIN
  -- Total unique entities (share codes)
  SELECT COUNT(DISTINCT share_code)::BIGINT INTO total_entities_count
  FROM shareholders;

  -- Total unique investors
  SELECT COUNT(DISTINCT investor_name)::BIGINT INTO total_investors_count
  FROM shareholders;

  -- Investor type distribution (grouped counts with total shares)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'type', investor_type,
      'count', cnt,
      'total_shares', total_shares
    ) ORDER BY total_shares DESC
  ), '[]'::jsonb)
  INTO investor_type_dist
  FROM (
    SELECT 
      COALESCE(investor_type, 'UK') AS investor_type,
      COUNT(*) AS cnt,
      SUM(COALESCE(total_holding_shares, 0)) AS total_shares
    FROM shareholders
    GROUP BY COALESCE(investor_type, 'UK')
  ) AS type_stats;

  -- Top concentrated issuers (where tracked ownership >1% is highest relative to total shares)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'share_code', share_code,
      'issuer_name', issuer_name,
      'concentration', concentration,
      'total_shares', total_shares,
      'holder_count', holder_count
    )
    ORDER BY concentration DESC
  ) FILTER (WHERE rn <= 10), '[]'::jsonb)
  INTO top_concentrated
  FROM (
    SELECT 
      share_code,
      MAX(issuer_name) AS issuer_name,
      SUM(COALESCE(percentage, 0)) AS concentration,
      SUM(COALESCE(total_holding_shares, 0)) AS total_shares,
      COUNT(*) AS holder_count,
      ROW_NUMBER() OVER (ORDER BY SUM(COALESCE(percentage, 0)) DESC) AS rn
    FROM shareholders
    WHERE COALESCE(percentage, 0) > 1
    GROUP BY share_code
  ) AS issuer_stats;

  -- Data quality metrics
  SELECT jsonb_build_object(
    'total_count', total_cnt,
    'valid_count', valid_cnt,
    'invalid_count', invalid_cnt,
    'integrity_percent', CASE WHEN total_cnt > 0 THEN (valid_cnt::FLOAT / total_cnt * 100)::DECIMAL(5,2) ELSE 0 END
  )
  INTO data_quality
  FROM (
    SELECT 
      COUNT(*)::BIGINT AS total_cnt,
      COUNT(*) FILTER (WHERE validation_status = 'VALID') AS valid_cnt,
      COUNT(*) FILTER (WHERE validation_status = 'INVALID') AS invalid_cnt
    FROM shareholders
  ) AS quality;

  -- Top 10 holders by percentage
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'investor_name', investor_name,
      'share_code', share_code,
      'issuer_name', issuer_name,
      'percentage', percentage,
      'total_holding_shares', total_holding_shares
    )
    ORDER BY percentage DESC
  ) FILTER (WHERE rn <= 10), '[]'::jsonb)
  INTO top_holders
  FROM (
    SELECT 
      investor_name,
      share_code,
      MAX(issuer_name) AS issuer_name,
      MAX(percentage) AS percentage,
      MAX(total_holding_shares) AS total_holding_shares,
      ROW_NUMBER() OVER (ORDER BY MAX(percentage) DESC) AS rn
    FROM shareholders
    WHERE percentage IS NOT NULL
    GROUP BY investor_name, share_code
  ) AS ranked_holders;

  -- Invalid rows (latest 10)
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'date', date,
      'share_code', share_code,
      'investor_name', investor_name,
      'investor_type', investor_type,
      'percentage', percentage,
      'validation_status', validation_status
    )
    ORDER BY date DESC
  ) FILTER (WHERE rn <= 10), '[]'::jsonb)
  INTO invalid_rows_data
  FROM (
    SELECT 
      id, date, share_code, investor_name, investor_type, percentage, validation_status,
      ROW_NUMBER() OVER (ORDER BY date DESC) AS rn
    FROM shareholders
    WHERE validation_status = 'INVALID'
  ) AS invalid_recs;

  -- Build final result
  result := jsonb_build_object(
    'total_entities', total_entities_count,
    'total_investors', total_investors_count,
    'investor_type_distribution', investor_type_dist,
    'top_concentrated_issuers', top_concentrated,
    'data_quality', data_quality,
    'top_holders', top_holders,
    'invalid_rows', invalid_rows_data
  );

  RETURN result;
END;
$$;