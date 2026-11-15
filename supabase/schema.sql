-- SoruCreate — Faz 2 Supabase şeması (henüz uygulanmadı).
-- src/lib/store.ts içindeki fonksiyonlar aynı imzalarla bu tablolara taşınacak.

create table if not exists public.soru_sayac (
  anahtar text primary key,          -- ör. 'LGS-MAT'
  deger   integer not null default 0
);

create table if not exists public.sorular (
  id             text primary key,   -- SC-LGS-MAT-00042
  sinav          text not null check (sinav in ('TYT','AYT','LGS')),
  ders           text not null,
  sinif          smallint not null,
  unite          text not null,
  kazanim_kodu   text not null,
  kazanim_metni  text not null,
  zorluk         text not null check (zorluk in ('orta','zor')),
  tur            text not null check (tur in ('gorselli','gorselsiz')),
  durum          text not null default 'taslak'
                 check (durum in ('taslak','onaylandi','revizyonda','kaldirildi')),
  surum          integer not null default 1,
  senaryo        text not null,
  kok            text not null,
  secenekler     jsonb not null,     -- [{harf, metin, gerekce}]
  dogru_cevap    text not null,
  cozum          text not null,
  beceri         text,
  gorsel         jsonb,              -- {aciklama, prompt, negatifPrompt, zorunluOgeler, svg, url}
  parmak_izi     text not null,
  meta           jsonb not null default '{}'::jsonb,
  olusturma      timestamptz not null default now(),
  guncelleme     timestamptz not null default now()
);
create index if not exists sorular_filtre_idx on public.sorular (sinav, ders, unite, zorluk, tur, durum);
create index if not exists sorular_kazanim_idx on public.sorular (kazanim_kodu);

create table if not exists public.soru_revizyonlari (
  id         bigint generated always as identity primary key,
  soru_id    text not null references public.sorular(id) on delete cascade,
  surum      integer not null,
  icerik     jsonb not null,
  neden      text,
  tarih      timestamptz not null default now()
);
create index if not exists soru_revizyonlari_soru_idx on public.soru_revizyonlari (soru_id);

create table if not exists public.soru_geribildirim (
  id         bigint generated always as identity primary key,
  soru_id    text not null references public.sorular(id) on delete cascade,
  karar      text not null check (karar in ('olmus','olmamis')),
  nedenler   text[] not null default '{}',
  not_metni  text,
  aksiyon    text check (aksiyon in ('revize','kaldir')),
  tarih      timestamptz not null default now()
);
create index if not exists soru_geribildirim_soru_idx on public.soru_geribildirim (soru_id);

alter table public.sorular            enable row level security;
alter table public.soru_revizyonlari  enable row level security;
alter table public.soru_geribildirim  enable row level security;
alter table public.soru_sayac         enable row level security;
-- Politikalar Auth eklendiğinde (editör / onaylayıcı rolleri) yazılacak.
