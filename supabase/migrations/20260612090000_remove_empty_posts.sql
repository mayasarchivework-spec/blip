-- Remove empty/null-looking post rows and prevent new ones.

delete from public.posts
where
  (
    type = 'text'::public.post_type
    and (
      nullif(btrim(content), '') is null
      or lower(btrim(content)) = 'null'
    )
  )
  or (
    type = 'photo'::public.post_type
    and nullif(btrim(coalesce(image_url, '')), '') is null
  )
  or (
    type = 'video'::public.post_type
    and nullif(btrim(coalesce(video_url, '')), '') is null
    and nullif(btrim(coalesce(image_url, '')), '') is null
  )
  or (
    type = 'song'::public.post_type
    and nullif(btrim(coalesce(song_title, '')), '') is null
    and nullif(btrim(coalesce(album_art_url, '')), '') is null
    and (
      nullif(btrim(content), '') is null
      or lower(btrim(content)) = 'null'
    )
  );

alter table public.posts
drop constraint if exists posts_have_renderable_payload;

alter table public.posts
add constraint posts_have_renderable_payload
check (
  case type
    when 'text'::public.post_type then
      nullif(btrim(content), '') is not null
      and lower(btrim(content)) <> 'null'
    when 'photo'::public.post_type then
      nullif(btrim(coalesce(image_url, '')), '') is not null
    when 'video'::public.post_type then
      coalesce(
        nullif(btrim(coalesce(video_url, '')), ''),
        nullif(btrim(coalesce(image_url, '')), '')
      ) is not null
    when 'song'::public.post_type then
      coalesce(
        nullif(btrim(coalesce(song_title, '')), ''),
        nullif(btrim(coalesce(album_art_url, '')), ''),
        nullif(btrim(content), '')
      ) is not null
      and lower(btrim(content)) <> 'null'
    else false
  end
);
