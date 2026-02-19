DROP TABLE IF EXISTS "zchords_example";

CREATE TABLE "zchords_instruments" (
  "id" uuid PRIMARY KEY NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "tuning" jsonb NOT NULL,
  "strings_count" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);

CREATE UNIQUE INDEX "zchords_instruments_code_unique" ON "zchords_instruments" ("code");
CREATE INDEX "zchords_instruments_updated_at_idx" ON "zchords_instruments" ("updated_at");

CREATE TABLE "zchords_chord_shapes" (
  "id" uuid PRIMARY KEY NOT NULL,
  "instrument_id" uuid NOT NULL,
  "chord_name" text NOT NULL,
  "frets" jsonb NOT NULL,
  "fingers" jsonb,
  "barres" jsonb,
  "base_fret" integer DEFAULT 1 NOT NULL,
  "tags" jsonb,
  "source" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone,
  CONSTRAINT "zchords_chord_shapes_instrument_fk" FOREIGN KEY ("instrument_id") REFERENCES "zchords_instruments"("id")
);

CREATE INDEX "zchords_chord_shapes_instrument_name_idx" ON "zchords_chord_shapes" ("instrument_id", "chord_name");
CREATE INDEX "zchords_chord_shapes_updated_at_idx" ON "zchords_chord_shapes" ("updated_at");

CREATE TABLE "zchords_songs" (
  "id" uuid PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "artist" text,
  "content_format" text DEFAULT 'chordpro' NOT NULL,
  "content" text NOT NULL,
  "key" text,
  "capo" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);

CREATE INDEX "zchords_songs_title_idx" ON "zchords_songs" ("title");
CREATE INDEX "zchords_songs_artist_idx" ON "zchords_songs" ("artist");
CREATE INDEX "zchords_songs_updated_at_idx" ON "zchords_songs" ("updated_at");

CREATE TABLE "zchords_playlists" (
  "id" uuid PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);

CREATE INDEX "zchords_playlists_updated_at_idx" ON "zchords_playlists" ("updated_at");

CREATE TABLE "zchords_playlist_items" (
  "id" uuid PRIMARY KEY NOT NULL,
  "playlist_id" uuid NOT NULL,
  "song_id" uuid NOT NULL,
  "position" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone,
  CONSTRAINT "zchords_playlist_items_playlist_fk" FOREIGN KEY ("playlist_id") REFERENCES "zchords_playlists"("id"),
  CONSTRAINT "zchords_playlist_items_song_fk" FOREIGN KEY ("song_id") REFERENCES "zchords_songs"("id")
);

CREATE INDEX "zchords_playlist_items_playlist_position_idx" ON "zchords_playlist_items" ("playlist_id", "position");
CREATE INDEX "zchords_playlist_items_updated_at_idx" ON "zchords_playlist_items" ("updated_at");

CREATE TABLE "zchords_meta" (
  "id" uuid PRIMARY KEY NOT NULL,
  "key" text NOT NULL,
  "value" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);

CREATE UNIQUE INDEX "zchords_meta_key_unique" ON "zchords_meta" ("key");
CREATE INDEX "zchords_meta_updated_at_idx" ON "zchords_meta" ("updated_at");
