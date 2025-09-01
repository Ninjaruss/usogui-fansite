--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: arc_translations_language_enum; Type: TYPE; Schema: public; Owner: ninjaruss
--

CREATE TYPE public.arc_translations_language_enum AS ENUM (
    'en',
    'ja'
);


ALTER TYPE public.arc_translations_language_enum OWNER TO ninjaruss;

--
-- Name: arc_type_enum; Type: TYPE; Schema: public; Owner: ninjaruss
--

CREATE TYPE public.arc_type_enum AS ENUM (
    'main',
    'mini'
);


ALTER TYPE public.arc_type_enum OWNER TO ninjaruss;

--
-- Name: chapter_translations_language_enum; Type: TYPE; Schema: public; Owner: ninjaruss
--

CREATE TYPE public.chapter_translations_language_enum AS ENUM (
    'en',
    'ja'
);


ALTER TYPE public.chapter_translations_language_enum OWNER TO ninjaruss;

--
-- Name: character_translations_language_enum; Type: TYPE; Schema: public; Owner: ninjaruss
--

CREATE TYPE public.character_translations_language_enum AS ENUM (
    'en',
    'ja'
);


ALTER TYPE public.character_translations_language_enum OWNER TO ninjaruss;

--
-- Name: event_translations_language_enum; Type: TYPE; Schema: public; Owner: ninjaruss
--

CREATE TYPE public.event_translations_language_enum AS ENUM (
    'en',
    'ja'
);


ALTER TYPE public.event_translations_language_enum OWNER TO ninjaruss;

--
-- Name: event_type_enum; Type: TYPE; Schema: public; Owner: ninjaruss
--

CREATE TYPE public.event_type_enum AS ENUM (
    'arc',
    'character_reveal',
    'plot_twist',
    'death',
    'backstory',
    'plot',
    'other'
);


ALTER TYPE public.event_type_enum OWNER TO ninjaruss;

--
-- Name: faction_translations_language_enum; Type: TYPE; Schema: public; Owner: ninjaruss
--

CREATE TYPE public.faction_translations_language_enum AS ENUM (
    'en',
    'ja'
);


ALTER TYPE public.faction_translations_language_enum OWNER TO ninjaruss;

--
-- Name: gamble_translations_language_enum; Type: TYPE; Schema: public; Owner: ninjaruss
--

CREATE TYPE public.gamble_translations_language_enum AS ENUM (
    'en',
    'ja'
);


ALTER TYPE public.gamble_translations_language_enum OWNER TO ninjaruss;

--
-- Name: guide_status_enum; Type: TYPE; Schema: public; Owner: ninjaruss
--

CREATE TYPE public.guide_status_enum AS ENUM (
    'draft',
    'pending',
    'published',
    'rejected'
);


ALTER TYPE public.guide_status_enum OWNER TO ninjaruss;

--
-- Name: media_status_enum; Type: TYPE; Schema: public; Owner: ninjaruss
--

CREATE TYPE public.media_status_enum AS ENUM (
    'pending',
    'approved',
    'rejected'
);


ALTER TYPE public.media_status_enum OWNER TO ninjaruss;

--
-- Name: media_type_enum; Type: TYPE; Schema: public; Owner: ninjaruss
--

CREATE TYPE public.media_type_enum AS ENUM (
    'image',
    'video',
    'audio'
);


ALTER TYPE public.media_type_enum OWNER TO ninjaruss;

--
-- Name: tag_translations_language_enum; Type: TYPE; Schema: public; Owner: ninjaruss
--

CREATE TYPE public.tag_translations_language_enum AS ENUM (
    'en',
    'ja'
);


ALTER TYPE public.tag_translations_language_enum OWNER TO ninjaruss;

--
-- Name: user_role_enum; Type: TYPE; Schema: public; Owner: ninjaruss
--

CREATE TYPE public.user_role_enum AS ENUM (
    'user',
    'admin',
    'moderator'
);


ALTER TYPE public.user_role_enum OWNER TO ninjaruss;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: arc; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.arc (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    type public.arc_type_enum DEFAULT 'main'::public.arc_type_enum NOT NULL,
    description text,
    "startChapter" integer,
    "endChapter" integer,
    "imageFileName" character varying(500),
    "imageDisplayName" character varying(200)
);


ALTER TABLE public.arc OWNER TO ninjaruss;

--
-- Name: arc_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.arc_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.arc_id_seq OWNER TO ninjaruss;

--
-- Name: arc_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.arc_id_seq OWNED BY public.arc.id;


--
-- Name: arc_translations; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.arc_translations (
    id integer NOT NULL,
    language public.arc_translations_language_enum DEFAULT 'en'::public.arc_translations_language_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    arc_id integer NOT NULL,
    name text NOT NULL,
    description text
);


ALTER TABLE public.arc_translations OWNER TO ninjaruss;

--
-- Name: arc_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.arc_translations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.arc_translations_id_seq OWNER TO ninjaruss;

--
-- Name: arc_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.arc_translations_id_seq OWNED BY public.arc_translations.id;


--
-- Name: chapter; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.chapter (
    id integer NOT NULL,
    number integer NOT NULL,
    title character varying(200),
    summary text
);


ALTER TABLE public.chapter OWNER TO ninjaruss;

--
-- Name: chapter_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.chapter_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chapter_id_seq OWNER TO ninjaruss;

--
-- Name: chapter_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.chapter_id_seq OWNED BY public.chapter.id;


--
-- Name: chapter_translations; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.chapter_translations (
    id integer NOT NULL,
    language public.chapter_translations_language_enum DEFAULT 'en'::public.chapter_translations_language_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    chapter_id integer NOT NULL,
    title text NOT NULL,
    summary text
);


ALTER TABLE public.chapter_translations OWNER TO ninjaruss;

--
-- Name: chapter_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.chapter_translations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.chapter_translations_id_seq OWNER TO ninjaruss;

--
-- Name: chapter_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.chapter_translations_id_seq OWNED BY public.chapter_translations.id;


--
-- Name: character; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public."character" (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    "alternateNames" text,
    description text,
    "firstAppearanceChapter" integer,
    "notableRoles" text,
    "notableGames" text,
    occupation character varying,
    affiliations text,
    "imageFileName" character varying(500),
    "imageDisplayName" character varying(200)
);


ALTER TABLE public."character" OWNER TO ninjaruss;

--
-- Name: character_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.character_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.character_id_seq OWNER TO ninjaruss;

--
-- Name: character_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.character_id_seq OWNED BY public."character".id;


--
-- Name: character_translations; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.character_translations (
    id integer NOT NULL,
    language public.character_translations_language_enum DEFAULT 'en'::public.character_translations_language_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    character_id integer NOT NULL,
    name text NOT NULL,
    description text
);


ALTER TABLE public.character_translations OWNER TO ninjaruss;

--
-- Name: character_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.character_translations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.character_translations_id_seq OWNER TO ninjaruss;

--
-- Name: character_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.character_translations_id_seq OWNED BY public.character_translations.id;


--
-- Name: event; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.event (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    type public.event_type_enum DEFAULT 'other'::public.event_type_enum NOT NULL,
    "startChapter" integer NOT NULL,
    "endChapter" integer,
    "spoilerChapter" integer,
    "pageNumbers" json,
    "isVerified" boolean DEFAULT false NOT NULL,
    "chapterReferences" json,
    "arcId" integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "createdById" integer
);


ALTER TABLE public.event OWNER TO ninjaruss;

--
-- Name: event_characters_character; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.event_characters_character (
    "eventId" integer NOT NULL,
    "characterId" integer NOT NULL
);


ALTER TABLE public.event_characters_character OWNER TO ninjaruss;

--
-- Name: event_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.event_id_seq OWNER TO ninjaruss;

--
-- Name: event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.event_id_seq OWNED BY public.event.id;


--
-- Name: event_translations; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.event_translations (
    id integer NOT NULL,
    language public.event_translations_language_enum DEFAULT 'en'::public.event_translations_language_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    event_id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL
);


ALTER TABLE public.event_translations OWNER TO ninjaruss;

--
-- Name: event_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.event_translations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.event_translations_id_seq OWNER TO ninjaruss;

--
-- Name: event_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.event_translations_id_seq OWNED BY public.event_translations.id;


--
-- Name: faction; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.faction (
    id integer NOT NULL,
    name character varying NOT NULL,
    description character varying
);


ALTER TABLE public.faction OWNER TO ninjaruss;

--
-- Name: faction_characters_character; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.faction_characters_character (
    "factionId" integer NOT NULL,
    "characterId" integer NOT NULL
);


ALTER TABLE public.faction_characters_character OWNER TO ninjaruss;

--
-- Name: faction_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.faction_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.faction_id_seq OWNER TO ninjaruss;

--
-- Name: faction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.faction_id_seq OWNED BY public.faction.id;


--
-- Name: faction_translations; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.faction_translations (
    id integer NOT NULL,
    language public.faction_translations_language_enum DEFAULT 'en'::public.faction_translations_language_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    faction_id integer NOT NULL,
    name text NOT NULL,
    description text
);


ALTER TABLE public.faction_translations OWNER TO ninjaruss;

--
-- Name: faction_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.faction_translations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.faction_translations_id_seq OWNER TO ninjaruss;

--
-- Name: faction_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.faction_translations_id_seq OWNED BY public.faction_translations.id;


--
-- Name: gamble; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.gamble (
    id integer NOT NULL,
    name character varying NOT NULL,
    rules text NOT NULL,
    "winCondition" text,
    "chapterId" integer NOT NULL,
    "hasTeams" boolean DEFAULT false NOT NULL,
    "winnerTeam" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.gamble OWNER TO ninjaruss;

--
-- Name: gamble_character; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.gamble_character (
    id integer NOT NULL,
    "teamName" character varying,
    "isWinner" boolean DEFAULT false NOT NULL,
    stake text,
    "gambleId" integer,
    "characterId" integer
);


ALTER TABLE public.gamble_character OWNER TO ninjaruss;

--
-- Name: gamble_character_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.gamble_character_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.gamble_character_id_seq OWNER TO ninjaruss;

--
-- Name: gamble_character_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.gamble_character_id_seq OWNED BY public.gamble_character.id;


--
-- Name: gamble_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.gamble_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.gamble_id_seq OWNER TO ninjaruss;

--
-- Name: gamble_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.gamble_id_seq OWNED BY public.gamble.id;


--
-- Name: gamble_observers; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.gamble_observers (
    "gambleId" integer NOT NULL,
    "characterId" integer NOT NULL
);


ALTER TABLE public.gamble_observers OWNER TO ninjaruss;

--
-- Name: gamble_round; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.gamble_round (
    id integer NOT NULL,
    "roundNumber" integer NOT NULL,
    "winnerTeam" character varying,
    outcome text NOT NULL,
    reward text,
    penalty text,
    "gambleId" integer
);


ALTER TABLE public.gamble_round OWNER TO ninjaruss;

--
-- Name: gamble_round_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.gamble_round_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.gamble_round_id_seq OWNER TO ninjaruss;

--
-- Name: gamble_round_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.gamble_round_id_seq OWNED BY public.gamble_round.id;


--
-- Name: gamble_translations; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.gamble_translations (
    id integer NOT NULL,
    language public.gamble_translations_language_enum DEFAULT 'en'::public.gamble_translations_language_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    gamble_id integer NOT NULL,
    name text NOT NULL,
    rules text NOT NULL,
    "winCondition" text
);


ALTER TABLE public.gamble_translations OWNER TO ninjaruss;

--
-- Name: gamble_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.gamble_translations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.gamble_translations_id_seq OWNER TO ninjaruss;

--
-- Name: gamble_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.gamble_translations_id_seq OWNED BY public.gamble_translations.id;


--
-- Name: guide; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.guide (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text NOT NULL,
    content text NOT NULL,
    status public.guide_status_enum DEFAULT 'draft'::public.guide_status_enum NOT NULL,
    "viewCount" integer DEFAULT 0 NOT NULL,
    "likeCount" integer DEFAULT 0 NOT NULL,
    "rejectionReason" character varying(500),
    "authorId" integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.guide OWNER TO ninjaruss;

--
-- Name: guide_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.guide_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.guide_id_seq OWNER TO ninjaruss;

--
-- Name: guide_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.guide_id_seq OWNED BY public.guide.id;


--
-- Name: guide_like; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.guide_like (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "guideId" integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.guide_like OWNER TO ninjaruss;

--
-- Name: guide_like_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.guide_like_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.guide_like_id_seq OWNER TO ninjaruss;

--
-- Name: guide_like_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.guide_like_id_seq OWNED BY public.guide_like.id;


--
-- Name: guide_tags; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.guide_tags (
    "guideId" integer NOT NULL,
    "tagId" integer NOT NULL
);


ALTER TABLE public.guide_tags OWNER TO ninjaruss;

--
-- Name: media; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.media (
    id integer NOT NULL,
    url character varying(2000),
    "fileName" character varying(255),
    "b2FileId" character varying(255),
    "isUploaded" boolean DEFAULT false NOT NULL,
    type public.media_type_enum NOT NULL,
    description character varying(500),
    "characterId" integer,
    "arcId" integer,
    "eventId" integer,
    status public.media_status_enum DEFAULT 'pending'::public.media_status_enum NOT NULL,
    "rejectionReason" character varying(500),
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "submittedById" integer NOT NULL
);


ALTER TABLE public.media OWNER TO ninjaruss;

--
-- Name: media_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.media_id_seq OWNER TO ninjaruss;

--
-- Name: media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.media_id_seq OWNED BY public.media.id;


--
-- Name: profile_image; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.profile_image (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "displayName" character varying NOT NULL,
    "fileName" character varying NOT NULL,
    description text,
    "characterId" integer NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    tags text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.profile_image OWNER TO ninjaruss;

--
-- Name: quote; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.quote (
    id integer NOT NULL,
    text text NOT NULL,
    "chapterNumber" integer NOT NULL,
    description text,
    "pageNumber" integer,
    "characterId" integer NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "submittedById" integer
);


ALTER TABLE public.quote OWNER TO ninjaruss;

--
-- Name: quote_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.quote_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.quote_id_seq OWNER TO ninjaruss;

--
-- Name: quote_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.quote_id_seq OWNED BY public.quote.id;


--
-- Name: tag; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.tag (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text
);


ALTER TABLE public.tag OWNER TO ninjaruss;

--
-- Name: tag_events_event; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.tag_events_event (
    "tagId" integer NOT NULL,
    "eventId" integer NOT NULL
);


ALTER TABLE public.tag_events_event OWNER TO ninjaruss;

--
-- Name: tag_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.tag_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tag_id_seq OWNER TO ninjaruss;

--
-- Name: tag_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.tag_id_seq OWNED BY public.tag.id;


--
-- Name: tag_translations; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.tag_translations (
    id integer NOT NULL,
    language public.tag_translations_language_enum DEFAULT 'en'::public.tag_translations_language_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    tag_id integer NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.tag_translations OWNER TO ninjaruss;

--
-- Name: tag_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.tag_translations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tag_translations_id_seq OWNER TO ninjaruss;

--
-- Name: tag_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.tag_translations_id_seq OWNED BY public.tag_translations.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    username character varying NOT NULL,
    email character varying NOT NULL,
    "isEmailVerified" boolean DEFAULT false NOT NULL,
    "emailVerificationToken" character varying,
    password character varying NOT NULL,
    "passwordResetToken" character varying,
    "passwordResetExpires" timestamp without time zone,
    role public.user_role_enum DEFAULT 'user'::public.user_role_enum NOT NULL,
    "userProgress" integer DEFAULT 1 NOT NULL,
    "profileImageId" uuid,
    "favoriteQuoteId" integer,
    "favoriteGambleId" integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "refreshToken" character varying
);


ALTER TABLE public."user" OWNER TO ninjaruss;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_id_seq OWNER TO ninjaruss;

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: volume; Type: TABLE; Schema: public; Owner: ninjaruss
--

CREATE TABLE public.volume (
    id integer NOT NULL,
    number integer NOT NULL,
    "coverUrl" character varying(500),
    "startChapter" integer NOT NULL,
    "endChapter" integer NOT NULL,
    description text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.volume OWNER TO ninjaruss;

--
-- Name: volume_id_seq; Type: SEQUENCE; Schema: public; Owner: ninjaruss
--

CREATE SEQUENCE public.volume_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.volume_id_seq OWNER TO ninjaruss;

--
-- Name: volume_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ninjaruss
--

ALTER SEQUENCE public.volume_id_seq OWNED BY public.volume.id;


--
-- Name: arc id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.arc ALTER COLUMN id SET DEFAULT nextval('public.arc_id_seq'::regclass);


--
-- Name: arc_translations id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.arc_translations ALTER COLUMN id SET DEFAULT nextval('public.arc_translations_id_seq'::regclass);


--
-- Name: chapter id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.chapter ALTER COLUMN id SET DEFAULT nextval('public.chapter_id_seq'::regclass);


--
-- Name: chapter_translations id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.chapter_translations ALTER COLUMN id SET DEFAULT nextval('public.chapter_translations_id_seq'::regclass);


--
-- Name: character id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public."character" ALTER COLUMN id SET DEFAULT nextval('public.character_id_seq'::regclass);


--
-- Name: character_translations id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.character_translations ALTER COLUMN id SET DEFAULT nextval('public.character_translations_id_seq'::regclass);


--
-- Name: event id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.event ALTER COLUMN id SET DEFAULT nextval('public.event_id_seq'::regclass);


--
-- Name: event_translations id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.event_translations ALTER COLUMN id SET DEFAULT nextval('public.event_translations_id_seq'::regclass);


--
-- Name: faction id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.faction ALTER COLUMN id SET DEFAULT nextval('public.faction_id_seq'::regclass);


--
-- Name: faction_translations id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.faction_translations ALTER COLUMN id SET DEFAULT nextval('public.faction_translations_id_seq'::regclass);


--
-- Name: gamble id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.gamble ALTER COLUMN id SET DEFAULT nextval('public.gamble_id_seq'::regclass);


--
-- Name: gamble_character id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.gamble_character ALTER COLUMN id SET DEFAULT nextval('public.gamble_character_id_seq'::regclass);


--
-- Name: gamble_round id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.gamble_round ALTER COLUMN id SET DEFAULT nextval('public.gamble_round_id_seq'::regclass);


--
-- Name: gamble_translations id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.gamble_translations ALTER COLUMN id SET DEFAULT nextval('public.gamble_translations_id_seq'::regclass);


--
-- Name: guide id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.guide ALTER COLUMN id SET DEFAULT nextval('public.guide_id_seq'::regclass);


--
-- Name: guide_like id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.guide_like ALTER COLUMN id SET DEFAULT nextval('public.guide_like_id_seq'::regclass);


--
-- Name: media id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.media ALTER COLUMN id SET DEFAULT nextval('public.media_id_seq'::regclass);


--
-- Name: quote id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.quote ALTER COLUMN id SET DEFAULT nextval('public.quote_id_seq'::regclass);


--
-- Name: tag id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.tag ALTER COLUMN id SET DEFAULT nextval('public.tag_id_seq'::regclass);


--
-- Name: tag_translations id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.tag_translations ALTER COLUMN id SET DEFAULT nextval('public.tag_translations_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Name: volume id; Type: DEFAULT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.volume ALTER COLUMN id SET DEFAULT nextval('public.volume_id_seq'::regclass);


--
-- Data for Name: arc; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.arc (id, name, "order", type, description, "startChapter", "endChapter", "imageFileName", "imageDisplayName") FROM stdin;
1	Introduction Arc	0	main	Introduction to the world of underground gambling and Baku Madarame's unique abilities. This arc establishes the foundation of the story, introducing key characters, the concept of lie detection, and the dangerous nature of high-stakes gambling.	1	10	\N	\N
2	Kakerou Initiation Arc	1	main	Baku's formal introduction to the Kakerou organization and its complex hierarchy. He learns about the rules, consequences, and opportunities within this underground gambling syndicate.	11	25	\N	\N
3	First Tournament Arc	2	main	Baku participates in his first major tournament, facing skilled opponents and learning the true depths of psychological warfare in gambling. Alliance formations and betrayals shape the narrative.	26	45	\N	\N
4	Protoporos Arc	3	main	A complex gambling game involving mathematical strategy and psychological manipulation. This arc showcases the intellectual depth of the story's games.	46	65	\N	\N
5	Character Development Arc	4	main	Focus on character backstories and relationships. Key character motivations are revealed, and the bonds between allies are tested and strengthened.	66	85	\N	\N
6	High Stakes Tournament Arc	5	main	A major tournament with life-or-death consequences. Multiple factions compete, and the stakes reach unprecedented levels.	86	120	\N	\N
\.


--
-- Data for Name: arc_translations; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.arc_translations (id, language, "createdAt", "updatedAt", arc_id, name, description) FROM stdin;
\.


--
-- Data for Name: chapter; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.chapter (id, number, title, summary) FROM stdin;
1	1	The Lie Eater	Introduction to Baku Madarame, a young man with the supernatural ability to detect lies. He enters the dangerous world of underground gambling through the mysterious organization known as Kakerou.
2	2	First Gamble	Baku takes on his first opponent in a high-stakes match, demonstrating his lie detection abilities and strategic thinking in a deadly game.
3	3	The Rules of Engagement	The complex rules and hierarchy of underground gambling are revealed. Baku learns about the serious consequences of failure in this world.
4	4	Stakes Rise	The stakes escalate as Baku faces increasingly dangerous opponents. The true nature of life-or-death gambling begins to show.
5	5	Meeting Marco	Baku encounters Marco Reiji, a skilled gambler who becomes an important ally. Their partnership begins to form.
6	6	Trust and Betrayal	The theme of trust becomes central as Baku navigates relationships in a world where betrayal can be fatal.
7	7	Psychological Warfare	Baku demonstrates his mastery of psychological manipulation, using his lie detection to gain advantages in complex games.
8	8	The Broker Appears	Introduction to Kyara Kujaku, the information broker who plays multiple sides and adds complexity to the underground network.
9	9	Double-Edged Games	A complex gamble with multiple layers of deception tests Baku's abilities to their limits.
10	10	End of Innocence	The conclusion of the introduction arc. Baku fully commits to the dangerous path of underground gambling, understanding there's no turning back.
\.


--
-- Data for Name: chapter_translations; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.chapter_translations (id, language, "createdAt", "updatedAt", chapter_id, title, summary) FROM stdin;
\.


--
-- Data for Name: character; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public."character" (id, name, "alternateNames", description, "firstAppearanceChapter", "notableRoles", "notableGames", occupation, affiliations, "imageFileName", "imageDisplayName") FROM stdin;
1	Baku Madarame	The Lie Eater,Mad Dog	The main protagonist, known for his ability to see through deception and his exceptional gambling skills. Baku has an uncanny ability to detect lies and uses this to his advantage in high-stakes gambling scenarios.	1	\N	\N	\N	\N	\N	\N
2	Marco Reiji	The Young Gun	A skilled gambler who becomes one of Baku's closest allies. Marco is known for his strategic thinking and unwavering loyalty to his friends.	5	\N	\N	\N	\N	\N	\N
3	Kyara Kujaku	The Broker	A cunning information broker who plays multiple sides. Known for his manipulative nature and extensive network of contacts in the underground world.	8	\N	\N	\N	\N	\N	\N
4	Sadakuni Ikki	Leader	The leader of Kakerou, a mysterious and powerful figure who oversees the organization's operations and maintains order in the underground gambling world.	12	\N	\N	\N	\N	\N	\N
5	Hal Arimura	The Calculator	A mathematical genius who excels at games requiring complex calculations and probability analysis. Often serves as an advisor in strategic situations.	15	\N	\N	\N	\N	\N	\N
6	Mako Obara	The Analyst	A careful observer and analyst who supports Baku's team with detailed analysis of opponents and situations.	20	\N	\N	\N	\N	\N	\N
7	Yakou Hikoichi	Night Owl	A night-dwelling gambler with expertise in underground networks and nocturnal gambling events.	25	\N	\N	\N	\N	\N	\N
8	Fukurou Tsukiyo	The Owl	A mysterious figure known for appearing at crucial moments with valuable information or assistance.	30	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: character_translations; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.character_translations (id, language, "createdAt", "updatedAt", character_id, name, description) FROM stdin;
\.


--
-- Data for Name: event; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.event (id, title, description, type, "startChapter", "endChapter", "spoilerChapter", "pageNumbers", "isVerified", "chapterReferences", "arcId", "createdAt", "updatedAt", "createdById") FROM stdin;
1	Baku's Introduction	The first appearance of Baku Madarame, showing his uncanny ability to detect lies and his gambling prowess.	character_reveal	1	1	1	[1,2,3]	t	[{"chapterNumber":1,"context":"First appearance - Introduction to the lie eater"}]	\N	2025-09-01 01:36:54.978092	2025-09-01 01:36:54.978092	\N
2	Meeting Marco	Baku encounters Marco Reiji, who becomes one of his closest allies in the gambling world.	character_reveal	5	5	5	[12,15,18]	t	[{"chapterNumber":5,"context":"Marco's introduction and first meeting with Baku"}]	\N	2025-09-01 01:36:54.982821	2025-09-01 01:36:54.982821	\N
3	Kakerou Introduction	The mysterious organization Kakerou is introduced, revealing the underground world of high-stakes gambling.	plot	1	3	1	[20,25,30]	t	[{"chapterNumber":1,"context":"First mention of Kakerou"},{"chapterNumber":3,"context":"Detailed explanation of the organization"}]	\N	2025-09-01 01:36:54.985064	2025-09-01 01:36:54.985064	\N
4	First Major Gamble	Baku participates in his first major gambling event, establishing his reputation in the underground scene.	arc	1	10	1	[5,8,12,20]	t	[{"chapterNumber":1,"context":"Introduction to the gambling event"},{"chapterNumber":10,"context":"Conclusion of the first major gamble"}]	\N	2025-09-01 01:36:54.98679	2025-09-01 01:36:54.98679	\N
5	The Lie Detection Ability	Baku's supernatural ability to detect lies is first demonstrated, showcasing what makes him unique.	character_reveal	1	1	1	[8,10]	t	[{"chapterNumber":1,"context":"First demonstration of Baku's lie detection ability"}]	\N	2025-09-01 01:36:54.988932	2025-09-01 01:36:54.988932	\N
\.


--
-- Data for Name: event_characters_character; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.event_characters_character ("eventId", "characterId") FROM stdin;
1	1
2	1
2	2
4	1
5	1
\.


--
-- Data for Name: event_translations; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.event_translations (id, language, "createdAt", "updatedAt", event_id, title, description) FROM stdin;
\.


--
-- Data for Name: faction; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.faction (id, name, description) FROM stdin;
1	Kakerou	A secret organization that oversees high-stakes gambling and illegal activities. Members are bound by strict rules and face severe consequences for betrayal.
2	IDEAL	A powerful criminal organization that operates various illegal businesses including gambling, smuggling, and information trading.
3	Clan	A yakuza organization involved in underground gambling and territorial disputes with other criminal groups.
4	Independent Gamblers	Freelance gamblers who don't belong to any specific organization but participate in underground gambling events.
5	Police Force	Law enforcement officers who are either investigating or secretly involved in the underground gambling world.
\.


--
-- Data for Name: faction_characters_character; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.faction_characters_character ("factionId", "characterId") FROM stdin;
1	1
1	2
\.


--
-- Data for Name: faction_translations; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.faction_translations (id, language, "createdAt", "updatedAt", faction_id, name, description) FROM stdin;
\.


--
-- Data for Name: gamble; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.gamble (id, name, rules, "winCondition", "chapterId", "hasTeams", "winnerTeam", "createdAt", "updatedAt") FROM stdin;
1	Protoporos	A game involving removing stones from piles. Players take turns removing any number of stones from a single pile. The objective varies depending on the specific variant being played.	The player who is forced to take the last stone loses the game.	1	f	\N	2025-09-01 01:36:55.028626	2025-09-01 01:36:55.028626
2	Poker Tournament	Standard Texas Hold'em poker with high stakes. Each player receives two hole cards and must make the best five-card hand using any combination of their hole cards and the community cards.	The player with the best hand at showdown wins the pot. The tournament continues until one player has all the chips.	5	f	\N	2025-09-01 01:36:55.036536	2025-09-01 01:36:55.036536
3	Russian Roulette Variant	A deadly variant of Russian Roulette using a special mechanism. Players take turns with specific rules that determine the outcome based on psychological and strategic elements.	Survive all rounds while maintaining psychological advantage over opponents.	10	f	\N	2025-09-01 01:36:55.043501	2025-09-01 01:36:55.043501
4	Card Matching Game	A complex card game involving memory, strategy, and psychological manipulation. Players must match cards while predicting opponent moves.	First player to achieve the target score or eliminate all opponents wins.	1	f	\N	2025-09-01 01:36:55.054817	2025-09-01 01:36:55.054817
\.


--
-- Data for Name: gamble_character; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.gamble_character (id, "teamName", "isWinner", stake, "gambleId", "characterId") FROM stdin;
1	\N	t	High stakes bet - Winner takes all	1	1
2	\N	f	Reputation and territorial rights	1	2
3	\N	t	High stakes bet - Winner takes all	2	1
4	\N	f	Reputation and territorial rights	2	2
5	\N	t	High stakes bet - Winner takes all	3	1
6	\N	f	Reputation and territorial rights	3	2
7	\N	t	High stakes bet - Winner takes all	4	1
8	\N	f	Reputation and territorial rights	4	2
\.


--
-- Data for Name: gamble_observers; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.gamble_observers ("gambleId", "characterId") FROM stdin;
\.


--
-- Data for Name: gamble_round; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.gamble_round (id, "roundNumber", "winnerTeam", outcome, reward, penalty, "gambleId") FROM stdin;
1	1	\N	Baku wins the first round of Protoporos through strategic play	Advancement to next round	None	1
2	2	\N	Marco makes a comeback in round 2 using psychological tactics	Equalizes the score	Baku loses momentum	1
3	3	\N	Final round won by Baku with a brilliant strategic move	Victory and all stakes	Marco forfeits his stake	1
4	1	\N	Baku wins the first round of Poker Tournament through strategic play	Advancement to next round	None	2
5	2	\N	Marco makes a comeback in round 2 using psychological tactics	Equalizes the score	Baku loses momentum	2
6	3	\N	Final round won by Baku with a brilliant strategic move	Victory and all stakes	Marco forfeits his stake	2
7	1	\N	Baku wins the first round of Russian Roulette Variant through strategic play	Advancement to next round	None	3
8	2	\N	Marco makes a comeback in round 2 using psychological tactics	Equalizes the score	Baku loses momentum	3
9	3	\N	Final round won by Baku with a brilliant strategic move	Victory and all stakes	Marco forfeits his stake	3
10	1	\N	Baku wins the first round of Card Matching Game through strategic play	Advancement to next round	None	4
11	2	\N	Marco makes a comeback in round 2 using psychological tactics	Equalizes the score	Baku loses momentum	4
12	3	\N	Final round won by Baku with a brilliant strategic move	Victory and all stakes	Marco forfeits his stake	4
\.


--
-- Data for Name: gamble_translations; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.gamble_translations (id, language, "createdAt", "updatedAt", gamble_id, name, rules, "winCondition") FROM stdin;
\.


--
-- Data for Name: guide; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.guide (id, title, description, content, status, "viewCount", "likeCount", "rejectionReason", "authorId", "createdAt", "updatedAt") FROM stdin;
1	Mastering Poker Psychology in Usogui	A comprehensive guide to understanding the psychological warfare that defines poker in the Usogui universe. Learn how Baku and other masters read their opponents.	# Mastering Poker Psychology in Usogui\n\n## Introduction\n\nIn the world of Usogui, poker isn't just a card game—it's a battlefield of minds where the slightest tell can mean the difference between life and death. This guide explores the psychological tactics used by master gamblers like Baku Madarame.\n\n## Key Concepts\n\n### 1. The Art of Reading Tells\n\nPhysical tells are the most obvious form of psychological information:\n- Micro-expressions lasting fractions of a second\n- Changes in breathing patterns\n- Subtle shifts in posture\n- Hand movements and finger positioning\n\n### 2. Emotional Control\n\nMaster gamblers maintain absolute emotional control:\n- Never show excitement when holding strong hands\n- Maintain the same demeanor regardless of hand strength\n- Use breathing techniques to control heart rate\n- Practice meditation to achieve mental clarity\n\n### 3. Misdirection and Bluffing\n\nAdvanced bluffing techniques:\n- Creating false tells to mislead opponents\n- Varying betting patterns to confuse reads\n- Using reverse psychology to induce specific actions\n- Timing bets for maximum psychological impact\n\n## Practical Applications\n\n### Example 1: The Baku Method\nWhen Baku sits at a poker table, he immediately begins cataloging every detail about his opponents...\n\n### Example 2: Counter-Psychology\nSometimes the best strategy is to let opponents think they've read you correctly...\n\n## Conclusion\n\nMastering poker psychology requires years of practice and keen observation. Start with basic tell recognition and gradually develop your own unique style.	published	350	2	\N	1	2025-09-01 01:36:55.107158	2025-09-01 01:36:55.117578
2	Understanding Game Theory in Gambling	An introduction to game theory principles and how they apply to various gambling scenarios in Usogui. Perfect for beginners looking to understand the mathematical foundations.	# Understanding Game Theory in Gambling\n\n## What is Game Theory?\n\nGame theory is the mathematical study of strategic decision-making between rational players. In gambling, this translates to understanding optimal plays and predicting opponent behavior.\n\n## Basic Concepts\n\n### Nash Equilibrium\nA state where no player can improve their outcome by unilaterally changing their strategy.\n\n### Expected Value\nThe average outcome of a decision when repeated many times:\n```\nEV = (Probability of Win × Win Amount) - (Probability of Loss × Loss Amount)\n```\n\n### Risk vs Reward\nEvery gambling decision involves weighing potential gains against potential losses.\n\n## Application in Usogui\n\n### The Protoporos Game\nThis unique game demonstrates pure game theory in action...\n\n### Poker Applications\nGame theory optimal (GTO) play in poker...\n\n## Exercises\n\nTry calculating the expected value for these scenarios:\n1. A coin flip bet with 2:1 odds\n2. A poker hand with 30% chance to win a $100 pot\n\nRemember: The house always has an edge, but understanding game theory helps you minimize losses and maximize wins when you do have an advantage.	published	464	2	\N	2	2025-09-01 01:36:55.119024	2025-09-01 01:36:55.124008
3	Character Analysis: Baku Madarame	A deep dive into the psychology and methods of Usogui's protagonist. Explore what makes Baku such a formidable gambler and strategist.	# Character Analysis: Baku Madarame\n\n## The Death God of Gambling\n\n  Baku Madarame, known as the "Death God," represents the pinnacle of gambling mastery in the Usogui universe. This analysis explores his methods, psychology, and evolution throughout the story.\n\n## Core Characteristics\n\n### Absolute Confidence\nBaku's most defining trait is his unwavering confidence:\n- Never shows doubt, even in impossible situations\n- Uses confidence as a weapon to intimidate opponents\n- Maintains composure under extreme pressure\n\n### Analytical Mind\nHis approach to gambling is highly analytical:\n- Observes every detail of opponents and environment\n- Calculates probabilities and odds instantly\n- Adapts strategies based on new information\n\n### Risk Tolerance\nBaku's relationship with risk is unique:\n- Willing to bet his life on games\n- Sees death as just another stake\n- Uses extreme risk to maximize psychological pressure\n\n## Famous Strategies\n\n### The Lie Detection Method\nBaku has developed sophisticated techniques for detecting lies...\n\n### Psychological Warfare\nHis ability to get inside opponents' heads...\n\n### Adaptive Gameplay\nHow Baku modifies his approach based on the opponent...\n\n## Evolution Throughout the Story\n\nFrom his early appearances to the final arcs, Baku's character development shows...\n\n## Lessons for Real Gambling\n\nWhile we can't all be Baku, there are practical lessons:\n- Maintain emotional control\n- Study your opponents carefully\n- Never bet more than you can afford to lose\n- Confidence is a powerful tool, but back it with skill\n\n## Conclusion\n\nBaku Madarame represents the idealized gambler—one who combines mathematical precision with psychological insight and absolute fearlessness.	published	414	4	\N	3	2025-09-01 01:36:55.125878	2025-09-01 01:36:55.133986
4	Beginner's Guide to Kakerou Rules	Everything you need to know about the Kakerou organization and its unique gambling rules. A must-read for newcomers to the Usogui universe.	# Beginner's Guide to Kakerou Rules\n\n## What is Kakerou?\n\nKakerou is the underground gambling organization that serves as the primary setting for most of Usogui's gambling battles. Understanding its rules and structure is essential for following the story.\n\n## Basic Structure\n\n### Membership\n- Regular members\n- Referees\n- Executives\n- The Leader\n\n### Ranking System\nKakerou operates on a strict hierarchy...\n\n## Game Rules\n\n### Standard Procedures\nAll Kakerou games follow certain protocols:\n1. Games must be overseen by official referees\n2. All participants must agree to stakes beforehand\n3. Cheating is allowed if undetected\n4. Disputes are resolved by referee judgment\n\n### Common Game Types\n- Card games (poker, blackjack variants)\n- Dice games\n- Unique Kakerou-exclusive games\n- Death games (highest stakes)\n\n## The Referee System\n\nReferees are crucial to maintaining order:\n- Must remain impartial\n- Can make binding decisions\n- Responsible for game integrity\n- Often former high-level gamblers\n\n## Notable Locations\n\n### Tower of Kakerou\nThe organization's headquarters...\n\n### Underground Venues\nVarious secret gambling locations...\n\n## Joining Kakerou\n\nRequirements and processes for membership...\n\n## Safety Considerations\n\nWhile Kakerou games are fictional, remember:\n- Real gambling can be addictive\n- Never bet money you can't afford to lose\n- Seek help if gambling becomes a problem\n\nThis is entertainment, not a guide to real gambling!	published	33	3	\N	4	2025-09-01 01:36:55.135492	2025-09-01 01:36:55.141776
5	Draft: Advanced Bluffing Techniques	Work in progress - exploring advanced bluffing strategies used by master gamblers. This guide is still being developed.	# Advanced Bluffing Techniques (DRAFT)\n\n## Introduction\n\nThis guide will cover advanced bluffing techniques... (work in progress)\n\n## Basic Concepts\n\n- What is a bluff?\n- When to bluff\n- Reading opponent tendencies\n\n## Advanced Techniques\n\n(To be completed)\n\n## Examples\n\n(Need to add specific examples from the story)\n\n## Conclusion\n\n(Draft - needs completion)	draft	477	0	\N	5	2025-09-01 01:36:55.143521	2025-09-01 01:36:55.143521
\.


--
-- Data for Name: guide_like; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.guide_like (id, "userId", "guideId", "createdAt") FROM stdin;
1	5	1	2025-09-01 01:36:55.11321
2	4	1	2025-09-01 01:36:55.115324
3	5	2	2025-09-01 01:36:55.121208
4	1	2	2025-09-01 01:36:55.122578
5	1	3	2025-09-01 01:36:55.128933
6	2	3	2025-09-01 01:36:55.130372
7	5	3	2025-09-01 01:36:55.131898
8	4	3	2025-09-01 01:36:55.133107
9	5	4	2025-09-01 01:36:55.138117
10	3	4	2025-09-01 01:36:55.139443
11	2	4	2025-09-01 01:36:55.14073
\.


--
-- Data for Name: guide_tags; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.guide_tags ("guideId", "tagId") FROM stdin;
1	16
1	17
1	18
2	16
2	20
2	21
3	16
3	18
3	19
4	20
4	21
5	16
5	17
\.


--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.media (id, url, "fileName", "b2FileId", "isUploaded", type, description, "characterId", "arcId", "eventId", status, "rejectionReason", "createdAt", "submittedById") FROM stdin;
1	https://www.youtube.com/watch?v=dQw4w9WgXcQ	\N	\N	f	video	Fan-made AMV showcasing Baku's most intense gambling moments	1	\N	\N	approved	\N	2025-09-01 01:36:55.079751	3
2	https://www.deviantart.com/example/art/baku-madarame-fanart-123456789	\N	\N	f	image	Digital artwork of Baku Madarame in his iconic pose	1	\N	\N	approved	\N	2025-09-01 01:36:55.082022	3
3	https://www.pixiv.net/en/artworks/123456789	\N	\N	f	image	Character illustration of Marco during the card tournament	2	\N	\N	approved	\N	2025-09-01 01:36:55.083572	3
4	https://twitter.com/example/status/123456789	\N	\N	f	image	Sketch of Baku and Marco working together	1	\N	\N	pending	\N	2025-09-01 01:36:55.085423	3
5	https://www.instagram.com/p/example123/	\N	\N	f	image	Cosplay photo of Baku Madarame costume	1	\N	\N	pending	\N	2025-09-01 01:36:55.088476	3
6	https://www.youtube.com/watch?v=example123	\N	\N	f	video	Analysis video discussing Usogui gambling strategies	\N	\N	\N	approved	\N	2025-09-01 01:36:55.091875	3
\.


--
-- Data for Name: profile_image; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.profile_image (id, "displayName", "fileName", description, "characterId", "isActive", "sortOrder", tags, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: quote; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.quote (id, text, "chapterNumber", description, "pageNumber", "characterId", "createdAt", "updatedAt", "submittedById") FROM stdin;
1	The essence of gambling is not about winning or losing... it's about the thrill of the unknown.	1	Baku's philosophy on gambling introduced early in the story	15	1	2025-09-01 01:36:54.996712	2025-09-01 01:36:54.996712	1
2	A lie isn't necessarily a bad thing. Sometimes it's the kindest truth you can offer.	3	Baku explaining his perspective on deception	22	1	2025-09-01 01:36:55.000125	2025-09-01 01:36:55.000125	1
3	In the world of gambling, trust is the most dangerous bet you can make.	5	Marco's cynical view on trust in gambling	8	2	2025-09-01 01:36:55.002854	2025-09-01 01:36:55.002854	1
4	I don't gamble to win money. I gamble to understand people.	7	Baku revealing his deeper motivation for gambling	34	1	2025-09-01 01:36:55.004699	2025-09-01 01:36:55.004699	1
5	The moment you think you've figured out the game is the moment you've already lost.	12	Baku's warning about overconfidence	19	1	2025-09-01 01:36:55.006682	2025-09-01 01:36:55.006682	1
6	Every gambler has a tell. The trick is knowing when they're telling the truth.	15	Marco discussing the psychology of gambling	41	2	2025-09-01 01:36:55.008952	2025-09-01 01:36:55.008952	1
7	Fear and excitement... they're closer than most people realize.	20	Baku on the emotional aspects of high-stakes gambling	27	1	2025-09-01 01:36:55.011069	2025-09-01 01:36:55.011069	1
8	The house always wins? That's what they want you to believe.	25	Marco challenging conventional gambling wisdom	12	2	2025-09-01 01:36:55.012828	2025-09-01 01:36:55.012828	1
9	Sometimes the best move is the one that makes no sense to anyone else.	30	Baku's unpredictable strategic approach	35	1	2025-09-01 01:36:55.014778	2025-09-01 01:36:55.014778	1
10	In gambling, as in life, the only certainty is uncertainty.	35	Philosophical reflection during a tense gambling match	45	1	2025-09-01 01:36:55.016424	2025-09-01 01:36:55.016424	1
11	You can't bluff someone who has nothing left to lose.	40	Marco observing desperate opponents	18	2	2025-09-01 01:36:55.019737	2025-09-01 01:36:55.019737	1
12	The real game isn't about the cards you're dealt, but how you play them.	45	Baku's perspective on strategy over luck	28	1	2025-09-01 01:36:55.021708	2025-09-01 01:36:55.021708	1
\.


--
-- Data for Name: tag; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.tag (id, name, description) FROM stdin;
1	High Stakes	Content involving high-stakes gambling scenarios with significant consequences
2	Psychological	Events that focus on psychological manipulation, mind games, and mental strategy
3	Action	Fast-paced scenes with physical confrontations or intense situations
4	Mystery	Events involving mysteries, hidden information, or plot reveals
5	Character Development	Scenes that significantly develop character backgrounds, motivations, or relationships
6	Plot Twist	Unexpected turns in the story that change the direction of the narrative
7	Gambling	Scenes focused on various forms of gambling and gaming
8	Kakerou	Content related to the Kakerou organization and its activities
9	Lie Detection	Scenes showcasing Baku's ability to detect lies and deception
10	Alliance	Formation or development of alliances between characters
11	Betrayal	Events involving betrayal or broken trust between characters
12	Strategy	Scenes focusing on strategic planning and tactical thinking
13	Backstory	Revelations about character backgrounds and past events
14	Tournament	Events related to organized gambling tournaments and competitions
15	Life or Death	Situations where characters face life-threatening consequences
16	strategy	Strategic gameplay and analysis
17	poker	Poker-related content
18	psychology	Psychological aspects of gambling
19	character-analysis	Character analysis and development
20	game-rules	Game rules and mechanics
21	theory	Theoretical concepts and frameworks
\.


--
-- Data for Name: tag_events_event; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.tag_events_event ("tagId", "eventId") FROM stdin;
\.


--
-- Data for Name: tag_translations; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.tag_translations (id, language, "createdAt", "updatedAt", tag_id, name) FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public."user" (id, username, email, "isEmailVerified", "emailVerificationToken", password, "passwordResetToken", "passwordResetExpires", role, "userProgress", "profileImageId", "favoriteQuoteId", "favoriteGambleId", "createdAt", "updatedAt", "refreshToken") FROM stdin;
1	admin	admin@usogui-fansite.com	t	\N	$2b$10$kZYlVVNAWKuckn8RuH48JOUU1WNgBEEzuA1saHOIV.DyRpKWao1cm	\N	\N	admin	50	\N	\N	\N	2025-09-01 01:36:54.44831	2025-09-01 01:36:54.44831	\N
2	moderator	moderator@usogui-fansite.com	t	\N	$2b$10$r8YeBfkV7ll9v1bVHooQh.7TBfKrvSE84yi.7Bu6COm6y48/kxzX.	\N	\N	moderator	30	\N	\N	\N	2025-09-01 01:36:54.562678	2025-09-01 01:36:54.562678	\N
3	testuser	test@example.com	t	\N	$2b$10$aP4J0RglhvO.WDpCr3PWTOAvq8Yjewo04hG6RloajhSxVL3zCg/tS	\N	\N	user	15	\N	\N	\N	2025-09-01 01:36:54.670322	2025-09-01 01:36:54.670322	\N
4	avid_reader	reader@example.com	t	\N	$2b$10$bWB9SgMoixLm7659STmAAu4M7h8S4Mixxf/dpHPa1.pToYPnZb6y6	\N	\N	user	42	\N	\N	\N	2025-09-01 01:36:54.777512	2025-09-01 01:36:54.777512	\N
5	manga_newbie	newbie@example.com	t	\N	$2b$10$NMXoyInoxyS1Eisv6L0F6OBalIzclGKAOKa6qBbhTyn068N.ruzcO	\N	\N	user	5	\N	\N	\N	2025-09-01 01:36:54.885031	2025-09-01 01:36:54.885031	\N
\.


--
-- Data for Name: volume; Type: TABLE DATA; Schema: public; Owner: ninjaruss
--

COPY public.volume (id, number, "coverUrl", "startChapter", "endChapter", description, "createdAt", "updatedAt") FROM stdin;
1	1	\N	1	10	Introduction to Baku Madarame and the underground gambling world	2025-09-01 01:36:54.90579	2025-09-01 01:36:54.90579
2	2	\N	11	20	Baku faces his first serious challenge in the gambling underworld	2025-09-01 01:36:54.907638	2025-09-01 01:36:54.907638
\.


--
-- Name: arc_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.arc_id_seq', 6, true);


--
-- Name: arc_translations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.arc_translations_id_seq', 1, false);


--
-- Name: chapter_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.chapter_id_seq', 10, true);


--
-- Name: chapter_translations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.chapter_translations_id_seq', 1, false);


--
-- Name: character_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.character_id_seq', 8, true);


--
-- Name: character_translations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.character_translations_id_seq', 1, false);


--
-- Name: event_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.event_id_seq', 5, true);


--
-- Name: event_translations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.event_translations_id_seq', 1, false);


--
-- Name: faction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.faction_id_seq', 5, true);


--
-- Name: faction_translations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.faction_translations_id_seq', 1, false);


--
-- Name: gamble_character_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.gamble_character_id_seq', 8, true);


--
-- Name: gamble_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.gamble_id_seq', 4, true);


--
-- Name: gamble_round_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.gamble_round_id_seq', 12, true);


--
-- Name: gamble_translations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.gamble_translations_id_seq', 1, false);


--
-- Name: guide_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.guide_id_seq', 5, true);


--
-- Name: guide_like_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.guide_like_id_seq', 11, true);


--
-- Name: media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.media_id_seq', 6, true);


--
-- Name: quote_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.quote_id_seq', 12, true);


--
-- Name: tag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.tag_id_seq', 21, true);


--
-- Name: tag_translations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.tag_translations_id_seq', 1, false);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.user_id_seq', 5, true);


--
-- Name: volume_id_seq; Type: SEQUENCE SET; Schema: public; Owner: ninjaruss
--

SELECT pg_catalog.setval('public.volume_id_seq', 2, true);


--
-- Name: arc_translations PK_147cea61df60781c0566e0aa9c4; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.arc_translations
    ADD CONSTRAINT "PK_147cea61df60781c0566e0aa9c4" PRIMARY KEY (id);


--
-- Name: faction_translations PK_1a9038eb16257ade2c54585a51b; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.faction_translations
    ADD CONSTRAINT "PK_1a9038eb16257ade2c54585a51b" PRIMARY KEY (id);


--
-- Name: character_translations PK_20ee0783c15af06ff3573e6d94c; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.character_translations
    ADD CONSTRAINT "PK_20ee0783c15af06ff3573e6d94c" PRIMARY KEY (id);


--
-- Name: event_translations PK_217547864a3f2e39502be2059cc; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.event_translations
    ADD CONSTRAINT "PK_217547864a3f2e39502be2059cc" PRIMARY KEY (id);


--
-- Name: chapter PK_275bd1c62bed7dff839680614ca; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.chapter
    ADD CONSTRAINT "PK_275bd1c62bed7dff839680614ca" PRIMARY KEY (id);


--
-- Name: event PK_30c2f3bbaf6d34a55f8ae6e4614; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY (id);


--
-- Name: faction_characters_character PK_4129946dd28d5412a3ffee0a35f; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.faction_characters_character
    ADD CONSTRAINT "PK_4129946dd28d5412a3ffee0a35f" PRIMARY KEY ("factionId", "characterId");


--
-- Name: profile_image PK_4a0c83016e1f1dc03ea2fcab948; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.profile_image
    ADD CONSTRAINT "PK_4a0c83016e1f1dc03ea2fcab948" PRIMARY KEY (id);


--
-- Name: arc PK_535dfa53a973685be1a3b5c135a; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.arc
    ADD CONSTRAINT "PK_535dfa53a973685be1a3b5c135a" PRIMARY KEY (id);


--
-- Name: faction PK_5935637aa4ecd999ac0555ae5a6; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.faction
    ADD CONSTRAINT "PK_5935637aa4ecd999ac0555ae5a6" PRIMARY KEY (id);


--
-- Name: volume PK_666025cd0c36727216bb7f2a680; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.volume
    ADD CONSTRAINT "PK_666025cd0c36727216bb7f2a680" PRIMARY KEY (id);


--
-- Name: character PK_6c4aec48c564968be15078b8ae5; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public."character"
    ADD CONSTRAINT "PK_6c4aec48c564968be15078b8ae5" PRIMARY KEY (id);


--
-- Name: tag_translations PK_6d541def9a3fbed4abeccd9f343; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.tag_translations
    ADD CONSTRAINT "PK_6d541def9a3fbed4abeccd9f343" PRIMARY KEY (id);


--
-- Name: tag PK_8e4052373c579afc1471f526760; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.tag
    ADD CONSTRAINT "PK_8e4052373c579afc1471f526760" PRIMARY KEY (id);


--
-- Name: guide_like PK_9bcd8c1dc653a5eae3383476584; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.guide_like
    ADD CONSTRAINT "PK_9bcd8c1dc653a5eae3383476584" PRIMARY KEY (id);


--
-- Name: guide_tags PK_9bff8e874b1b916b115419b920a; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.guide_tags
    ADD CONSTRAINT "PK_9bff8e874b1b916b115419b920a" PRIMARY KEY ("guideId", "tagId");


--
-- Name: gamble_translations PK_9e9656aac88ea538c72b949da7b; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.gamble_translations
    ADD CONSTRAINT "PK_9e9656aac88ea538c72b949da7b" PRIMARY KEY (id);


--
-- Name: quote PK_b772d4cb09e587c8c72a78d2439; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.quote
    ADD CONSTRAINT "PK_b772d4cb09e587c8c72a78d2439" PRIMARY KEY (id);


--
-- Name: gamble_observers PK_ba1999f5a5e9d64f4bf5b606c08; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.gamble_observers
    ADD CONSTRAINT "PK_ba1999f5a5e9d64f4bf5b606c08" PRIMARY KEY ("gambleId", "characterId");


--
-- Name: chapter_translations PK_c662864bbebcb1327f491ad15cf; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.chapter_translations
    ADD CONSTRAINT "PK_c662864bbebcb1327f491ad15cf" PRIMARY KEY (id);


--
-- Name: user PK_cace4a159ff9f2512dd42373760; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY (id);


--
-- Name: tag_events_event PK_d9690e3673e9b67dd839839fccd; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.tag_events_event
    ADD CONSTRAINT "PK_d9690e3673e9b67dd839839fccd" PRIMARY KEY ("tagId", "eventId");


--
-- Name: gamble PK_e20a3e7c86231e62616281b64c8; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.gamble
    ADD CONSTRAINT "PK_e20a3e7c86231e62616281b64c8" PRIMARY KEY (id);


--
-- Name: gamble_character PK_e880e918c63bb40d8d0d2c20cf4; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.gamble_character
    ADD CONSTRAINT "PK_e880e918c63bb40d8d0d2c20cf4" PRIMARY KEY (id);


--
-- Name: gamble_round PK_e8933414eeeebdf5dc164a30cfd; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.gamble_round
    ADD CONSTRAINT "PK_e8933414eeeebdf5dc164a30cfd" PRIMARY KEY (id);


--
-- Name: media PK_f4e0fcac36e050de337b670d8bd; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT "PK_f4e0fcac36e050de337b670d8bd" PRIMARY KEY (id);


--
-- Name: event_characters_character PK_f5817021e0b43101db0ae310fb8; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.event_characters_character
    ADD CONSTRAINT "PK_f5817021e0b43101db0ae310fb8" PRIMARY KEY ("eventId", "characterId");


--
-- Name: guide PK_fe92b4af32150e0580d37eacaef; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.guide
    ADD CONSTRAINT "PK_fe92b4af32150e0580d37eacaef" PRIMARY KEY (id);


--
-- Name: user UQ_78a916df40e02a9deb1c4b75edb; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE (username);


--
-- Name: user UQ_e12875dfb3b1d92d7d7c5377e22; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE (email);


--
-- Name: guide_like UQ_f3cda9cbb5ea9b41ab5aa4673bb; Type: CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.guide_like
    ADD CONSTRAINT "UQ_f3cda9cbb5ea9b41ab5aa4673bb" UNIQUE ("userId", "guideId");


--
-- Name: IDX_0e5c4e20d6347103f882d8312a; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_0e5c4e20d6347103f882d8312a" ON public."user" USING btree ("emailVerificationToken");


--
-- Name: IDX_13865e0b4bb9d196fad771300d; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_13865e0b4bb9d196fad771300d" ON public.guide USING btree ("likeCount");


--
-- Name: IDX_15b7dc59ce71215e861ace5650; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_15b7dc59ce71215e861ace5650" ON public.profile_image USING btree ("isActive");


--
-- Name: IDX_1a18c7410deb61433ed8ba77aa; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_1a18c7410deb61433ed8ba77aa" ON public.guide_like USING btree ("userId");


--
-- Name: IDX_1d5a6b5f38273d74f192ae552a; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_1d5a6b5f38273d74f192ae552a" ON public.event USING btree ("createdById");


--
-- Name: IDX_232b38de454865379da4de910c; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_232b38de454865379da4de910c" ON public.gamble_observers USING btree ("characterId");


--
-- Name: IDX_28a2b51f426d340d6d24ffb7f3; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_28a2b51f426d340d6d24ffb7f3" ON public.quote USING btree ("chapterNumber");


--
-- Name: IDX_37a72578aedebe0c630fae767b; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_37a72578aedebe0c630fae767b" ON public.guide USING btree ("authorId");


--
-- Name: IDX_39b1fd373ff5cac1145dcdf0f9; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_39b1fd373ff5cac1145dcdf0f9" ON public.guide_like USING btree ("guideId");


--
-- Name: IDX_42a60c07e4b566f0cc06a1eaaf; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_42a60c07e4b566f0cc06a1eaaf" ON public.media USING btree (url);


--
-- Name: IDX_4ccd63876554023ce6a4e863c2; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_4ccd63876554023ce6a4e863c2" ON public.event USING btree (title);


--
-- Name: IDX_59347e69b1bbd757500955be73; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_59347e69b1bbd757500955be73" ON public.event USING btree ("spoilerChapter");


--
-- Name: IDX_599be49b119364742a8c959249; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_599be49b119364742a8c959249" ON public.event_characters_character USING btree ("eventId");


--
-- Name: IDX_60f2129886c2b4098d03a586eb; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_60f2129886c2b4098d03a586eb" ON public.guide USING btree ("viewCount");


--
-- Name: IDX_65c1bda8beb2257cc72c8581f6; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_65c1bda8beb2257cc72c8581f6" ON public.media USING btree ("submittedById");


--
-- Name: IDX_6a9775008add570dc3e5a0bab7; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE UNIQUE INDEX "IDX_6a9775008add570dc3e5a0bab7" ON public.tag USING btree (name);


--
-- Name: IDX_97c4f69b950df60f24b40906d1; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_97c4f69b950df60f24b40906d1" ON public.event USING btree ("arcId");


--
-- Name: IDX_9ce7587daf696e4a5bcea30270; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_9ce7587daf696e4a5bcea30270" ON public.faction_characters_character USING btree ("factionId");


--
-- Name: IDX_9f1c58c9f967a9ab0e078f080a; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_9f1c58c9f967a9ab0e078f080a" ON public.quote USING btree ("characterId");


--
-- Name: IDX_ab52662a10d1de80d79d0b70e8; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_ab52662a10d1de80d79d0b70e8" ON public.profile_image USING btree ("characterId", "isActive");


--
-- Name: IDX_ad835f960aeb250220c7337e87; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_ad835f960aeb250220c7337e87" ON public.guide_tags USING btree ("tagId");


--
-- Name: IDX_b13bbf52535c5e92b0c76c4a9a; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_b13bbf52535c5e92b0c76c4a9a" ON public.event_characters_character USING btree ("characterId");


--
-- Name: IDX_b378fdb2f215014e26d33a7a44; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_b378fdb2f215014e26d33a7a44" ON public.quote USING btree ("submittedById");


--
-- Name: IDX_b8c3aeeac35ace9d387fb5e142; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_b8c3aeeac35ace9d387fb5e142" ON public.event USING btree (type);


--
-- Name: IDX_bf38287323e91e9dfc2a492ffe; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_bf38287323e91e9dfc2a492ffe" ON public.tag_events_event USING btree ("tagId");


--
-- Name: IDX_bfb14a1cc741c1fb77d99e7110; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_bfb14a1cc741c1fb77d99e7110" ON public."user" USING btree ("passwordResetToken");


--
-- Name: IDX_cf52fa3ff9ce0f8b83afe13b75; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_cf52fa3ff9ce0f8b83afe13b75" ON public.gamble_observers USING btree ("gambleId");


--
-- Name: IDX_d80158dde1461b74ed8499e7d8; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_d80158dde1461b74ed8499e7d8" ON public."character" USING btree (name);


--
-- Name: IDX_d96a12730463a1732f0b91626a; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_d96a12730463a1732f0b91626a" ON public.arc USING btree ("order");


--
-- Name: IDX_dd502c817c477cc2b229af6a83; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_dd502c817c477cc2b229af6a83" ON public.tag_events_event USING btree ("eventId");


--
-- Name: IDX_e14678ea9cffcc9920723fcc63; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_e14678ea9cffcc9920723fcc63" ON public.guide USING btree (status);


--
-- Name: IDX_e955aec78ee58c697ec9b84f8c; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_e955aec78ee58c697ec9b84f8c" ON public.arc USING btree (name);


--
-- Name: IDX_ed0f2136ba1c01a2a21c3f8c0d; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_ed0f2136ba1c01a2a21c3f8c0d" ON public.guide USING btree ("createdAt");


--
-- Name: IDX_eeb559296c35173e2aeb5d6ec9; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_eeb559296c35173e2aeb5d6ec9" ON public.event USING btree ("startChapter", "endChapter");


--
-- Name: IDX_f10c1e1dce80efd38b959931fb; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_f10c1e1dce80efd38b959931fb" ON public.faction_characters_character USING btree ("characterId");


--
-- Name: IDX_fe0162b72a05285cf1cc8aac16; Type: INDEX; Schema: public; Owner: ninjaruss
--

CREATE INDEX "IDX_fe0162b72a05285cf1cc8aac16" ON public.guide_tags USING btree ("guideId");


--
-- Name: profile_image FK_079950e14fd5c6a06ae4c954389; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.profile_image
    ADD CONSTRAINT "FK_079950e14fd5c6a06ae4c954389" FOREIGN KEY ("characterId") REFERENCES public."character"(id);


--
-- Name: guide_like FK_1a18c7410deb61433ed8ba77aac; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.guide_like
    ADD CONSTRAINT "FK_1a18c7410deb61433ed8ba77aac" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE;


--
-- Name: arc_translations FK_1ac3ee2da3459fbfb132d12246b; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.arc_translations
    ADD CONSTRAINT "FK_1ac3ee2da3459fbfb132d12246b" FOREIGN KEY (arc_id) REFERENCES public.arc(id) ON DELETE CASCADE;


--
-- Name: event FK_1d5a6b5f38273d74f192ae552a6; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT "FK_1d5a6b5f38273d74f192ae552a6" FOREIGN KEY ("createdById") REFERENCES public."user"(id);


--
-- Name: gamble_observers FK_232b38de454865379da4de910ca; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.gamble_observers
    ADD CONSTRAINT "FK_232b38de454865379da4de910ca" FOREIGN KEY ("characterId") REFERENCES public."character"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: guide FK_37a72578aedebe0c630fae767bd; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.guide
    ADD CONSTRAINT "FK_37a72578aedebe0c630fae767bd" FOREIGN KEY ("authorId") REFERENCES public."user"(id);


--
-- Name: guide_like FK_39b1fd373ff5cac1145dcdf0f9b; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.guide_like
    ADD CONSTRAINT "FK_39b1fd373ff5cac1145dcdf0f9b" FOREIGN KEY ("guideId") REFERENCES public.guide(id) ON DELETE CASCADE;


--
-- Name: gamble_character FK_43b0ab1f0547e3280adf1f66acf; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.gamble_character
    ADD CONSTRAINT "FK_43b0ab1f0547e3280adf1f66acf" FOREIGN KEY ("gambleId") REFERENCES public.gamble(id) ON DELETE CASCADE;


--
-- Name: gamble_round FK_4441d160c1d97b0629f1fc07ac1; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.gamble_round
    ADD CONSTRAINT "FK_4441d160c1d97b0629f1fc07ac1" FOREIGN KEY ("gambleId") REFERENCES public.gamble(id) ON DELETE CASCADE;


--
-- Name: media FK_4f40a4a46ca65138c9462d912fe; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT "FK_4f40a4a46ca65138c9462d912fe" FOREIGN KEY ("eventId") REFERENCES public.event(id);


--
-- Name: user FK_5799d879a5c8a4060dd7c2f9cf2; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "FK_5799d879a5c8a4060dd7c2f9cf2" FOREIGN KEY ("favoriteQuoteId") REFERENCES public.quote(id);


--
-- Name: event_characters_character FK_599be49b119364742a8c9592492; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.event_characters_character
    ADD CONSTRAINT "FK_599be49b119364742a8c9592492" FOREIGN KEY ("eventId") REFERENCES public.event(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user FK_5c0981de5dc2a2222a1f0574859; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "FK_5c0981de5dc2a2222a1f0574859" FOREIGN KEY ("profileImageId") REFERENCES public.profile_image(id);


--
-- Name: media FK_65c1bda8beb2257cc72c8581f6f; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT "FK_65c1bda8beb2257cc72c8581f6f" FOREIGN KEY ("submittedById") REFERENCES public."user"(id);


--
-- Name: chapter_translations FK_65f0a50ae9f6130ce0e82e60c6f; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.chapter_translations
    ADD CONSTRAINT "FK_65f0a50ae9f6130ce0e82e60c6f" FOREIGN KEY (chapter_id) REFERENCES public.chapter(id) ON DELETE CASCADE;


--
-- Name: gamble FK_873c55cea2cf5eae8a6dd18a5fb; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.gamble
    ADD CONSTRAINT "FK_873c55cea2cf5eae8a6dd18a5fb" FOREIGN KEY ("chapterId") REFERENCES public.chapter(id);


--
-- Name: event FK_97c4f69b950df60f24b40906d1e; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT "FK_97c4f69b950df60f24b40906d1e" FOREIGN KEY ("arcId") REFERENCES public.arc(id);


--
-- Name: faction_characters_character FK_9ce7587daf696e4a5bcea30270f; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.faction_characters_character
    ADD CONSTRAINT "FK_9ce7587daf696e4a5bcea30270f" FOREIGN KEY ("factionId") REFERENCES public.faction(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quote FK_9f1c58c9f967a9ab0e078f080a7; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.quote
    ADD CONSTRAINT "FK_9f1c58c9f967a9ab0e078f080a7" FOREIGN KEY ("characterId") REFERENCES public."character"(id) ON DELETE CASCADE;


--
-- Name: event_translations FK_a6c15dd689a8f7a51fca191a207; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.event_translations
    ADD CONSTRAINT "FK_a6c15dd689a8f7a51fca191a207" FOREIGN KEY (event_id) REFERENCES public.event(id) ON DELETE CASCADE;


--
-- Name: media FK_acbd3d2de4357d42cfa20c2e278; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT "FK_acbd3d2de4357d42cfa20c2e278" FOREIGN KEY ("arcId") REFERENCES public.arc(id);


--
-- Name: guide_tags FK_ad835f960aeb250220c7337e872; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.guide_tags
    ADD CONSTRAINT "FK_ad835f960aeb250220c7337e872" FOREIGN KEY ("tagId") REFERENCES public.tag(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: event_characters_character FK_b13bbf52535c5e92b0c76c4a9a7; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.event_characters_character
    ADD CONSTRAINT "FK_b13bbf52535c5e92b0c76c4a9a7" FOREIGN KEY ("characterId") REFERENCES public."character"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: quote FK_b378fdb2f215014e26d33a7a44f; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.quote
    ADD CONSTRAINT "FK_b378fdb2f215014e26d33a7a44f" FOREIGN KEY ("submittedById") REFERENCES public."user"(id);


--
-- Name: character_translations FK_bdb39a702b2ddad049bc43bba43; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.character_translations
    ADD CONSTRAINT "FK_bdb39a702b2ddad049bc43bba43" FOREIGN KEY (character_id) REFERENCES public."character"(id) ON DELETE CASCADE;


--
-- Name: tag_events_event FK_bf38287323e91e9dfc2a492ffe3; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.tag_events_event
    ADD CONSTRAINT "FK_bf38287323e91e9dfc2a492ffe3" FOREIGN KEY ("tagId") REFERENCES public.tag(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: faction_translations FK_c7c363047732db699554634d0a6; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.faction_translations
    ADD CONSTRAINT "FK_c7c363047732db699554634d0a6" FOREIGN KEY (faction_id) REFERENCES public.faction(id) ON DELETE CASCADE;


--
-- Name: gamble_character FK_cc23ce8d8f3eca47eafbd4eff3e; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.gamble_character
    ADD CONSTRAINT "FK_cc23ce8d8f3eca47eafbd4eff3e" FOREIGN KEY ("characterId") REFERENCES public."character"(id);


--
-- Name: gamble_observers FK_cf52fa3ff9ce0f8b83afe13b756; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.gamble_observers
    ADD CONSTRAINT "FK_cf52fa3ff9ce0f8b83afe13b756" FOREIGN KEY ("gambleId") REFERENCES public.gamble(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: gamble_translations FK_d4c380b96d5adca6b2d69ebe778; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.gamble_translations
    ADD CONSTRAINT "FK_d4c380b96d5adca6b2d69ebe778" FOREIGN KEY (gamble_id) REFERENCES public.gamble(id) ON DELETE CASCADE;


--
-- Name: user FK_d4c5584cafc3279bce4ac235962; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "FK_d4c5584cafc3279bce4ac235962" FOREIGN KEY ("favoriteGambleId") REFERENCES public.gamble(id);


--
-- Name: tag_events_event FK_dd502c817c477cc2b229af6a839; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.tag_events_event
    ADD CONSTRAINT "FK_dd502c817c477cc2b229af6a839" FOREIGN KEY ("eventId") REFERENCES public.event(id);


--
-- Name: tag_translations FK_e656e089d689dbb4306d2cd1b0d; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.tag_translations
    ADD CONSTRAINT "FK_e656e089d689dbb4306d2cd1b0d" FOREIGN KEY (tag_id) REFERENCES public.tag(id) ON DELETE CASCADE;


--
-- Name: faction_characters_character FK_f10c1e1dce80efd38b959931fbd; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.faction_characters_character
    ADD CONSTRAINT "FK_f10c1e1dce80efd38b959931fbd" FOREIGN KEY ("characterId") REFERENCES public."character"(id);


--
-- Name: media FK_fc91eaabffff0ec9ed36988c95e; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT "FK_fc91eaabffff0ec9ed36988c95e" FOREIGN KEY ("characterId") REFERENCES public."character"(id) ON DELETE CASCADE;


--
-- Name: guide_tags FK_fe0162b72a05285cf1cc8aac167; Type: FK CONSTRAINT; Schema: public; Owner: ninjaruss
--

ALTER TABLE ONLY public.guide_tags
    ADD CONSTRAINT "FK_fe0162b72a05285cf1cc8aac167" FOREIGN KEY ("guideId") REFERENCES public.guide(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

