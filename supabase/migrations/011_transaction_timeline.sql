-- Create transaction timeline view to show creation and update history
-- Safe to run multiple times in Supabase SQL editor

drop view if exists public.transaction_timeline;

create view public.transaction_timeline as
select 
  t.id,
  t.user_id,
  t.space_id,
  t.type,
  t.amount,
  t.description,
  t.payment_method,
  t.date,
  t.notes,
  t.receipt_url,
  t.is_recurring,
  t.created_at as created_at,
  p_creator.name as created_by_name,
  p_creator.avatar_url as created_by_avatar,
  t.updated_at as updated_at,
  p_updater.name as updated_by_name,
  p_updater.avatar_url as updated_by_avatar,
  case 
    when t.updated_at > t.created_at + interval '1 minute' then true
    else false
  end as has_updates,
  -- Timeline events (JSON array for frontend consumption)
  jsonb_build_array(
    jsonb_build_object(
      'event', 'created',
      'timestamp', t.created_at,
      'user_id', t.user_id,
      'user_name', p_creator.name,
      'user_avatar', p_creator.avatar_url
    ),
    case 
      when t.updated_at > t.created_at + interval '1 minute' then
        jsonb_build_object(
          'event', 'updated',
          'timestamp', t.updated_at,
          'user_id', t.updated_by,
          'user_name', p_updater.name,
          'user_avatar', p_updater.avatar_url
        )
      else null::jsonb
    end
  ) as timeline_events
from public.transactions t
left join public.profiles p_creator on t.user_id = p_creator.id
left join public.profiles p_updater on t.updated_by = p_updater.id;

-- Add comment to document the view
comment on view public.transaction_timeline is 
'Timeline view showing transaction creation and update history with user information';
