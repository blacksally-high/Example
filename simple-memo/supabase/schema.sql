-- Additive schema. The pre-existing public.memos table is untouched.
create table public.memo_notes (
 id uuid primary key, user_id uuid not null references auth.users(id) on delete cascade,
 content text not null check (length(btrim(content)) > 0 and content !~ '^[[:space:]]*$' and char_length(content) <= 20000),
 is_pinned boolean not null default false, created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), deleted_at timestamptz,
 version bigint not null default 1, last_operation uuid not null,
 imported_created_at timestamptz
);
alter table public.memo_notes enable row level security;
create policy memo_read_own on public.memo_notes for select to authenticated using ((select auth.uid())=user_id);
create index memo_notes_owner_order on public.memo_notes(user_id,is_pinned desc,updated_at desc,id);
create index memo_notes_owner_trash on public.memo_notes(user_id,deleted_at);
revoke all on public.memo_notes from anon,authenticated;
grant select on public.memo_notes to authenticated;
-- All writes are confined to this checked API: clients cannot set owners, versions or timestamps.
create function public.memo_save(p_id uuid,p_content text,p_pinned boolean,p_deleted boolean,p_version bigint,p_operation uuid,p_imported timestamptz default null)
returns setof public.memo_notes language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid(); v_row public.memo_notes;
begin
 if v_user is null or not exists(select 1 from auth.users where id=v_user) then raise exception 'AUTH_REQUIRED'; end if;
 if length(btrim(p_content))=0 or p_content ~ '^[[:space:]]*$' or char_length(p_content)>20000 then raise exception 'INVALID_CONTENT'; end if;
 select * into v_row from public.memo_notes where id=p_id and user_id=v_user for update;
 if found then
  if v_row.last_operation=p_operation then return next v_row; return; end if;
  if v_row.version<>p_version then raise exception 'MEMO_CONFLICT'; end if;
  update public.memo_notes set content=p_content,is_pinned=p_pinned,deleted_at=case when p_deleted then coalesce(deleted_at,now()) else null end,updated_at=now(),version=version+1,last_operation=p_operation where id=p_id and user_id=v_user returning * into v_row;
 else
  if p_version<>0 then raise exception 'MEMO_CONFLICT'; end if;
  insert into public.memo_notes(id,user_id,content,is_pinned,deleted_at,last_operation,imported_created_at) values(p_id,v_user,p_content,p_pinned,case when p_deleted then now() else null end,p_operation,p_imported) returning * into v_row;
 end if;
 return next v_row;
end $$;
revoke all on function public.memo_save(uuid,text,boolean,boolean,bigint,uuid,timestamptz) from public,anon;
grant execute on function public.memo_save(uuid,text,boolean,boolean,bigint,uuid,timestamptz) to authenticated;
create function public.memo_remove(p_id uuid,p_version bigint) returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid()) then raise exception 'AUTH_REQUIRED'; end if;
 delete from public.memo_notes where id=p_id and user_id=auth.uid() and deleted_at is not null and version=p_version;
 if not found then raise exception 'MEMO_CONFLICT'; end if;
end $$;
revoke all on function public.memo_remove(uuid,bigint) from public,anon;
grant execute on function public.memo_remove(uuid,bigint) to authenticated;
create function public.memo_list(p_search text default '',p_trash boolean default false,p_offset integer default 0,p_limit integer default 40,p_all boolean default false)
returns setof public.memo_notes language sql stable security invoker set search_path='' as $$
 select * from public.memo_notes where user_id=(select auth.uid()) and (p_all or (deleted_at is not null)=p_trash) and (p_search='' or position(lower(p_search) in lower(content))>0)
 order by is_pinned desc,updated_at desc,id asc limit least(greatest(p_limit,1),200) offset greatest(p_offset,0);
$$;
revoke all on function public.memo_list(text,boolean,integer,integer,boolean) from public,anon;
grant execute on function public.memo_list(text,boolean,integer,integer,boolean) to authenticated;
