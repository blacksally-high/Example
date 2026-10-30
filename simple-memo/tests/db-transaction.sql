begin;
select set_config('test.user_a',gen_random_uuid()::text,true),set_config('test.user_b',gen_random_uuid()::text,true),set_config('test.note_id',gen_random_uuid()::text,true),set_config('test.op',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role) values(current_setting('test.user_a')::uuid,'authenticated','authenticated'),(current_setting('test.user_b')::uuid,'authenticated','authenticated');
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.user_a'),true);
do $$ declare n public.memo_notes; begin
 select * into n from public.memo_save(current_setting('test.note_id')::uuid,'한글 검증 🌿',false,false,0,current_setting('test.op')::uuid);
 if n.version<>1 then raise exception 'test: initial version';end if;
 select * into n from public.memo_save(current_setting('test.note_id')::uuid,'한글 검증 🌿',false,false,0,current_setting('test.op')::uuid);
 if n.version<>1 then raise exception 'test: idempotency';end if;
 begin perform public.memo_save(current_setting('test.note_id')::uuid,'outdated',false,false,0,gen_random_uuid()); raise exception 'test: stale update allowed';exception when raise_exception then if SQLERRM<>'MEMO_CONFLICT' then raise;end if;end;
 if (select count(*) from public.memo_list('한글',false,0,40,false))<>1 then raise exception 'test: korean search';end if;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.user_b'),true);
do $$begin
 if exists(select 1 from public.memo_notes where id=current_setting('test.note_id')::uuid) then raise exception 'test: cross-user read';end if;
 if exists(select 1 from public.memo_list('한글',false,0,40,false)) then raise exception 'test: cross-user search';end if;
 begin perform public.memo_save(current_setting('test.note_id')::uuid,'attack',false,false,1,gen_random_uuid()); raise exception 'test: cross-user update';exception when raise_exception then if SQLERRM<>'MEMO_CONFLICT' then raise;end if;end;
 begin perform public.memo_remove(current_setting('test.note_id')::uuid,1); raise exception 'test: cross-user delete';exception when raise_exception then if SQLERRM<>'MEMO_CONFLICT' then raise;end if;end;
end $$;
reset role;
select 'PASS: own create/read, Korean search, idempotency, stale conflict, cross-user read/search/update/delete blocked. All fixture data rolled back.' as result;
rollback;
