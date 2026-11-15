-- SoruCreate — Supabase şeması (sorucreate projesine uygulandı: migration "sorucreate_init").

create table public.sorular (
  id            text primary key,          -- SC-LGS-MAT-00042
  sinav         text not null check (sinav in ('TYT','AYT','LGS')),
  ders          text not null,
  kazanim_kodu  text not null,
  durum         text not null check (durum in ('taslak','onaylandi','revizyonda','kaldirildi')),
  data          jsonb not null,            -- Soru nesnesinin tamamı (src/lib/types.ts)
  olusturma     timestamptz not null default now(),
  guncelleme    timestamptz not null default now()
);
create index sorular_filtre_idx on public.sorular (sinav, ders, durum);
create index sorular_kazanim_idx on public.sorular (kazanim_kodu);
create index sorular_olusturma_idx on public.sorular (olusturma desc);

create table public.soru_sayac (
  anahtar text primary key,
  deger   integer not null default 0
);

create or replace function public.sayac_artir(p_anahtar text, p_adet integer)
returns integer language sql set search_path = '' as $$
  insert into public.soru_sayac as s (anahtar, deger) values (p_anahtar, p_adet)
  on conflict (anahtar) do update set deger = s.deger + excluded.deger
  returning deger;
$$;

create table public.uretim_isleri (
  id           uuid primary key default gen_random_uuid(),
  durum        text not null default 'kuyrukta' check (durum in ('kuyrukta','calisiyor','tamam','hata')),
  istek        jsonb not null,
  soru_idleri  text[] not null default '{}',
  hata         text,
  isci         text,
  olusturma    timestamptz not null default now(),
  baslama      timestamptz,
  bitis        timestamptz
);
create index uretim_isleri_kuyruk_idx on public.uretim_isleri (olusturma) where durum = 'kuyrukta';
create index uretim_isleri_olusturma_idx on public.uretim_isleri (olusturma desc);

-- Kuyruktan bir işi atomik olarak alır (birden fazla üretici aynı işi kapmaz).
create or replace function public.is_al(p_isci text)
returns setof public.uretim_isleri language sql set search_path = '' as $$
  update public.uretim_isleri u
     set durum = 'calisiyor', baslama = now(), isci = p_isci
   where u.id = (select id from public.uretim_isleri where durum = 'kuyrukta'
                  order by olusturma for update skip locked limit 1)
  returning u.*;
$$;

alter table public.sorular       enable row level security;
alter table public.soru_sayac    enable row level security;
alter table public.uretim_isleri enable row level security;
-- Politika yok: yalnızca sunucu tarafındaki service_role anahtarı erişir.
revoke all on public.sorular, public.soru_sayac, public.uretim_isleri from anon, authenticated;
revoke execute on function public.sayac_artir(text, integer) from public, anon, authenticated;
revoke execute on function public.is_al(text) from public, anon, authenticated;
grant execute on function public.sayac_artir(text, integer) to service_role;
grant execute on function public.is_al(text) to service_role;
