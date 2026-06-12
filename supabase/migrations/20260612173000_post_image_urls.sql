-- Allow a post to keep up to 20 attached images.

alter table public.posts
add column if not exists image_urls jsonb not null default '[]'::jsonb;

alter table public.posts
drop constraint if exists posts_image_urls_array_check;

alter table public.posts
add constraint posts_image_urls_array_check
check (
  jsonb_typeof(image_urls) = 'array'
  and jsonb_array_length(image_urls) <= 20
);
