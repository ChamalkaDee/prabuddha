-- Book categories: new tables, the starting set of categories, and a
-- suggested tag for each of the 242 books on the shelf on 14 Nov 2026.
--
-- Run ONCE in Supabase → SQL Editor before deploying the category code.
-- It only CREATES two new tables and INSERTS rows into them. No existing
-- book, image, translation, loan or member row is changed or removed.
-- Safe to run twice (IF NOT EXISTS / ON CONFLICT DO NOTHING).
--
-- Do NOT use `prisma migrate dev` (see 2026-11-14_copies_pin_banner.sql).

BEGIN;

CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameSi" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameIt" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");

CREATE TABLE IF NOT EXISTS "BookCategory" (
    "bookId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "BookCategory_pkey" PRIMARY KEY ("bookId","categoryId"),
    CONSTRAINT "BookCategory_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BookCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BookCategory_categoryId_idx" ON "BookCategory"("categoryId");

-- Categories (id = 'cat_' + slug so the tags below can refer to them).
INSERT INTO "Category" ("id","slug","nameSi","nameEn","nameIt","position") VALUES
  ('cat_sinhala-lit','sinhala-lit','සිංහල සාහිත්‍යය','Sinhala literature','Letteratura singalese',1),
  ('cat_world-fiction','world-fiction','ලෝක සාහිත්‍ය පරිවර්තන','World fiction','Narrativa dal mondo',2),
  ('cat_buddhism','buddhism','බුදු දහම','Buddhism','Buddhismo',3),
  ('cat_spirituality','spirituality','භාවනා සහ අධ්‍යාත්මය','Meditation & spirituality','Meditazione e spiritualità',4),
  ('cat_self-help','self-help','ජීවිත සංවර්ධනය','Self-help & success','Crescita personale',5),
  ('cat_mind','mind','මනෝවිද්‍යාව','Psychology & the mind','Psicologia',6),
  ('cat_business','business','ව්‍යාපාර සහ මුදල්','Business & money','Economia e finanza',7),
  ('cat_biography','biography','චරිතාපදාන සහ ඉතිහාසය','Biography & history','Biografie e storia',8),
  ('cat_society','society','සමාජය සහ දේශපාලනය','Society & ideas','Società e idee',9),
  ('cat_children','children','ළමා සහ දෙමාපිය','Children & parenting','Bambini e genitori',10),
  ('cat_folk','folk','ජනකතා සහ උපමා කතා','Folk tales & fables','Fiabe e racconti',11)
ON CONFLICT DO NOTHING;

-- Suggested tags. A book id that no longer exists is skipped by the
-- JOIN, so a book deleted since the list was taken cannot cause an error.
INSERT INTO "BookCategory" ("bookId","categoryId")
SELECT t."bookId", t."categoryId"
FROM (VALUES
  ('cmwdw8v0i000f08jmuzdbn7r4','cat_buddhism'),  -- Mindfulness සරලව දකිමු
  ('cmwdw8v0i000f08jmuzdbn7r4','cat_spirituality'),  -- Mindfulness සරලව දකිමු
  ('cmwdw5vz7000c08jmzij3opik','cat_world-fiction'),  -- ගුරු ගීතය
  ('cmwdw3ez9000908jmppkprxuv','cat_world-fiction'),  -- ධීවර ගීතය
  ('cmwdw0jhs000s08je5s9q47tl','cat_sinhala-lit'),  -- පෙත්සම
  ('cmwdvyucb000608jmfj5gkwyi','cat_world-fiction'),  -- දෙ නූවර අන්දරය
  ('cmwdvwk1p000p08jmrova6vi4','cat_world-fiction'),  -- තුන් වසර
  ('cmwdvuek3000308jm1g1v7axp','cat_world-fiction'),  -- බැද්දේගම
  ('cmwdvsd4t000m08jmzdlrw5nr','cat_sinhala-lit'),  -- අක්කර පහ
  ('cmwdvqhfw000j08jmqdpfts4s','cat_world-fiction'),  -- බ්‍රීඩා
  ('cmwdvopne000008jmakwqmick','cat_self-help'),  -- එය එසේම සිදුවෙයි
  ('cmwdvn2xo000g08jml4m8z9h6','cat_spirituality'),  -- මණි පද්ම භාවනා
  ('cmwdvn2xo000g08jml4m8z9h6','cat_buddhism'),  -- මණි පද්ම භාවනා
  ('cmwdvkx4j000d08jmb6g6impa','cat_sinhala-lit'),  -- මන්දෝදරී
  ('cmwdviudy000p08jelwpd4bvn','cat_world-fiction'),  -- බ්‍රීඩා
  ('cmwdvcz49001308jp6mqmw3tg','cat_spirituality'),  -- භාවනාව, කුණ්ඩලීනී බලය සහ අධිමානසික විද්‍යාවේ රහස්
  ('cmwdvabhl000908jmu7gqd7pk','cat_buddhism'),  -- ථෙරවාද බුද්ධ චරිතය
  ('cmwdvabhl000908jmu7gqd7pk','cat_biography'),  -- ථෙරවාද බුද්ධ චරිතය
  ('cmwdv7lv2000l08jeri4t0exk','cat_children'),  -- බාලාංශ කථා හෙවත් දනුමැතිහාමිගේ සතිපතා පන්තිය
  ('cmwdv3gez000608jm4cce98f3','cat_folk'),  -- තොටගමුවේ ශ්‍රී රාහුල හිමියන්ගේ අප්‍රකට ජනප්‍රවාද
  ('cmwduz3nf000i08jeu0xuqx9h','cat_buddhism'),  -- සත්‍යෝදය
  ('cmwduwh36000308jmyga4k112','cat_buddhism'),  -- කවදානම් අපි නිදහස් වෙමුද?
  ('cmwdutz58000008jmivrhwy5t','cat_biography'),  -- ජාතිය අවදි කළ එස්. මහින්ද හිමි
  ('cmwduqhr9001008jpfkfef9i3','cat_sinhala-lit'),  -- මනෝමන්දිර
  ('cmwduoren000x08jp4bzwn2s6','cat_mind'),  -- මිනිස් සිත
  ('cmwdumtl7000f08jekchp203e','cat_folk'),  -- මුල්ලා නස්රුදින්ගේ කතා
  ('cmwdujfgf000c08jew6xsrij2','cat_buddhism'),  -- මහ රහතුන් වැඩි මඟ ඔස්සේ
  ('cmwdugvuv000908jewj0p90ty','cat_business'),  -- ඵලදායිතාවය වර්ධනය සඳහා තත්ත්ව කව සංකල්ප
  ('cmwduesyb000u08jpoq44h3uv','cat_business'),  -- ඵලදායිතාවය වර්ධනය තුළින් විශිෂ්ටත්වය
  ('cmwducdjz000r08jpsv56o0xe','cat_self-help'),  -- නායකත්වය
  ('cmwducdjz000r08jpsv56o0xe','cat_business'),  -- නායකත්වය
  ('cmwdu9umd000608jeuef7vj52','cat_folk'),  -- කවට අන්දරේ
  ('cmwdu7xca000308jeke6gzlq9','cat_children'),  -- ළමා කතන්දර
  ('cmwdu5f1i000008je43cvapu6','cat_biography'),  -- ලොව පසිඳු සොයාගැනීම්
  ('cmwdu218x000o08jpwi9x90i2','cat_business'),  -- ඵලදායිතාවය වර්ධනය සඳහා පංචවිධ සංකල්ප
  ('cmwdtytxf000l08jphhbh3jee','cat_spirituality'),  -- අල් - හදීස් (නබි වදන් සියයක්)
  ('cmwdtuymx000i08jpfn3rusve','cat_world-fiction'),  -- මහල්ලා සහ මුහුද
  ('cmwdtsg94000f08jpivbhq7w3','cat_society'),  -- සන්-සුට්ගේ යුද කලාව
  ('cmwdtsg94000f08jpivbhq7w3','cat_business'),  -- සන්-සුට්ගේ යුද කලාව
  ('cmwdtp32n000c08jpv06jsksn','cat_biography'),  -- අධිරාජ්‍යයක් හෙල්ලූ පුංචි මිනිසා
  ('cmwdtl4v7000908jpoj8r1gsm','cat_buddhism'),  -- සූත්‍ර නවය
  ('cmwdthhwm000307jwws4byozq','cat_biography'),  -- ලුයී බ්රේල්
  ('cmwdthhwm000307jwws4byozq','cat_children'),  -- ලුයී බ්රේල්
  ('cmwdte3fz000007jw7vms2e2r','cat_biography'),  -- මහා ඇලෙක්සැන්ඩර් රජුගේ අසිරිමත් ජීවන චරිතය
  ('cmwdtbch9000307kynwcj8jvf','cat_biography'),  -- වික්‍රමාන්විත ගරිල්ලා චේ
  ('cmwdt7v68000007kyyuu2rzh9','cat_sinhala-lit'),  -- යුගාන්තය
  ('cmwdt5wuj000608jpq7ywpe68','cat_society'),  -- මැකියාවෙලිගේ ලෝකය
  ('cmwdsxvdu000308jpotl46ytd','cat_self-help'),  -- හදවත දිනන මඟ හි සිත්ගැනීම
  ('cmwdsuytn000008jpg2xo0e2y','cat_self-help'),  -- සමෘද්ධිමත් ජීවිතයකට මඟ
  ('cmwdss629000s07iizuo50sxo','cat_world-fiction'),  -- පොලියානා
  ('cmwdss629000s07iizuo50sxo','cat_children'),  -- පොලියානා
  ('cmwdspx3p000y07jyo6z72noa','cat_self-help'),  -- ජීවිතය දිනන්නේ මෙහෙමයි
  ('cmwdsmce0000v07jyj8o5h7t6','cat_business'),  -- බිස්නස් පිස්සුව
  ('cmwdsk10g000c08krfu829mpd','cat_biography'),  -- රොබට් නොක්ස්
  ('cmwdshswg000908krhg6u87tf','cat_spirituality'),  -- සාවධානය
  ('cmwdse6ua000608krimn9xj16','cat_business'),  -- වසරේ CEO
  ('cmwdsbd9e000308krs6pas6l9','cat_children'),  -- හරි පුදුම ඉස්කෝලේ
  ('cmwdsbd9e000308krs6pas6l9','cat_world-fiction'),  -- හරි පුදුම ඉස්කෝලේ
  ('cmwds6dkr000p07iiiff0ufwu','cat_sinhala-lit'),  -- මාගම් සෝලිය
  ('cmwds37dh000s07jya3eyg8to','cat_sinhala-lit'),  -- අසීමා
  ('cmwds08oj000m07iilvnvwdbt','cat_mind'),  -- මිනිස් දිවියේ අරුත සොයා
  ('cmwds08oj000m07iilvnvwdbt','cat_biography'),  -- මිනිස් දිවියේ අරුත සොයා
  ('cmwdrxwvg000p07jy5esnd8rm','cat_buddhism'),  -- ඉසිවර නුවණින්
  ('cmwdrutqx000m07jy317epauj','cat_sinhala-lit'),  -- පෙන බුබුළු
  ('cmwdrsx4q000008krw9xi91q7','cat_buddhism'),  -- සරු සාර දිවියකට බුදු බණ
  ('cmwdrpi6g000j07jyv8fc6odk','cat_biography'),  -- මහත්මා ගාන්ධි
  ('cmwdrnha6000g07jynkx54p9d','cat_biography'),  -- පෝරකය ඉව කළ මිනිස්සු
  ('cmwdrjyf3000d07jybhpp86nl','cat_sinhala-lit'),  -- විජ්ජුලතාගේ තනේ
  ('cmwdrg37h000j07iik845zqud','cat_sinhala-lit'),  -- Toxic ගර්භ විස
  ('cmwdrc0u4000g07iire0u4yz5','cat_sinhala-lit'),  -- ලොවීනා
  ('cmwdr8x94000d07iiemsjlbiy','cat_sinhala-lit'),  -- ඉරා අඳුරු පට
  ('cmwdr6pui000c08jyyig3xc0i','cat_society'),  -- පොදුජන නීති අත් පොත
  ('cmwdr3p6g000a07jy3of6i11l','cat_biography'),  -- චේ
  ('cmwdr1hp9000707jythorltnr','cat_buddhism'),  -- භගවාන් බුද්ධ
  ('cmwdr1hp9000707jythorltnr','cat_biography'),  -- භගවාන් බුද්ධ
  ('cmwdqwtvq000a07iiqpaxq73d','cat_society'),  -- ජීවිතයට ගරු කරන්න
  ('cmwdqv70j000908jy744yq12a','cat_children'),  -- ඔබේ දරුවා ගැන ඔබ දත යුතු දේ
  ('cmwdqsr5l000407jy5rfw06cs','cat_children'),  -- දරුවාට සුන්දර ලොවක්
  ('cmwdqpl4o000107jyg4wt543j','cat_self-help'),  -- ජීවිතේ ගීතයක්ම වේවා
  ('cmwdqn42e000707iim4bdu9ik','cat_sinhala-lit'),  -- මළගිය ඇත්තෝ
  ('cmwdqjy38000608jysjysiirq','cat_folk'),  -- ඊසොප්ගේ උපමා කතා 100 ක්
  ('cmwdqjy38000608jysjysiirq','cat_children'),  -- ඊසොප්ගේ උපමා කතා 100 ක්
  ('cmwdqhfxl000407iiuj9j1lyt','cat_biography'),  -- ඊ. ඩබ්. අදිකාරම්
  ('cmwdqelor000k08l8eo4z3c0z','cat_folk'),  -- දේවමැදි හත්පත්තුවේ තවත් ජනකතා
  ('cmwdqbqqf000h08l85260v2on','cat_world-fiction'),  -- ෆොරස්ට් ගම්ප්
  ('cmwdq7xb6000308jyufu723er','cat_self-help'),  -- අත්හැරීමේ කලාව
  ('cmwdq58qe000008jyzy79mpq6','cat_self-help'),  -- සිතුවිලිවල බලය
  ('cmwdq58qe000008jyzy79mpq6','cat_mind'),  -- සිතුවිලිවල බලය
  ('cmwdq1g9g000007iiw0l4pd6d','cat_self-help'),  -- දෛවය වෙනස් කළ හැකිය
  ('cmwdpt9qd000v08l55dn0v5z2','cat_spirituality'),  -- අපගේ දිනපතා භෝජනය
  ('cmwdprp4y000s08l5nbqj4p4y','cat_spirituality'),  -- අපගේ දිනපතා භෝජනය
  ('cmwdpmxmn000e08l8offr7c4a','cat_world-fiction'),  -- කුමාරයා
  ('cmwdpmxmn000e08l8offr7c4a','cat_children'),  -- කුමාරයා
  ('cmwdpkazq000b08l8vdwtdr9m','cat_world-fiction'),  -- ලොලිටා
  ('cmwdpersz000p08l5wdzrrmxv','cat_sinhala-lit'),  -- ප්‍රංශ පෙම්වතා
  ('cmwdp8na2000l08l5rjygdiak','cat_world-fiction'),  -- ඇනා කැරණිනා
  ('cmwdp665i000i08l5zfakrqag','cat_sinhala-lit'),  -- සප්තපර්ණී
  ('cmwdp3gq9000f08l50gc8kuiz','cat_world-fiction'),  -- ඔවුහු බැග්ඩෑඩ් ආවෝය
  ('cmwdp0cl2001i08l8hkx3m88j','cat_world-fiction'),  -- තුන් සිත
  ('cmwdoy8kc001f08l8g3aaxirs','cat_world-fiction'),  -- අපරාධය සහ දඬුවම
  ('cmwdotwsk001c08l8xn6r8a48','cat_world-fiction'),  -- පියවරු සහ පුත්තු
  ('cmwdor7tr001908l8w9zzpit1','cat_world-fiction'),  -- අම්මා
  ('cmwdoou8a000608l8mv8zrm6d','cat_society'),  -- ජීවිතයට ගරු කරන්න
  ('cmwdokwka000308l8gs6lw6j2','cat_sinhala-lit'),  -- සොංකොට්ටං
  ('cmwdogisk000c08l58y3fv52h','cat_buddhism'),  -- වෛඩූර්ය ප්‍රභ තථාගත සූත්‍රය
  ('cmwdobw7r000008l87hry5b8b','cat_spirituality'),  -- ස්වභාවයේ ස්වභාවයක්
  ('cmwdo6gpb000908l5ctg0n6pp','cat_buddhism'),  -- හකුයිං යසෙංකන්නා
  ('cmwdo6gpb000908l5ctg0n6pp','cat_spirituality'),  -- හකුයිං යසෙංකන්නා
  ('cmwdo1pqe000608l5qgsivxng','cat_buddhism'),  -- මර්පා
  ('cmwdo1pqe000608l5qgsivxng','cat_biography'),  -- මර්පා
  ('cmwdnyddz000m08l0tdlthmrp','cat_spirituality'),  -- ආධුනිකයන් සඳහා සූක්ෂම ලෙස සංචරණය හෙවත් සියුම්-කය සැරිය
  ('cmwdnuu6b001608l8opvxi1n2','cat_spirituality'),  -- මහා මුද්‍රා භාවනා
  ('cmwdnuu6b001608l8opvxi1n2','cat_buddhism'),  -- මහා මුද්‍රා භාවනා
  ('cmwdnsku5001308l8w9oirudi','cat_spirituality'),  -- සෙන් දුනු ශිල්පය
  ('cmwdnpae2001008l8eg65iatb','cat_buddhism'),  -- ගර්භාවක්‍රින්තී සූත්‍රය
  ('cmwdnmf5t000x08l8tv3pq9ya','cat_buddhism'),  -- අවබෝධයේ හදවත
  ('cmwdnjop6000308l5eu15uoo5','cat_spirituality'),  -- ජීවිතය ආදරය සිනහව
  ('cmwdnfuny000j08l0b7l32nq4','cat_spirituality'),  -- දොන් ජුවන්ගේ ඉගැන්වීම්
  ('cmwdnd0uy000008l54l0excmf','cat_spirituality'),  -- හරා
  ('cmwdn81c9000u08l88wreb22z','cat_world-fiction'),  -- ගෝඩ්ෆාදර්
  ('cmwdn41wj000l07lb2jq83xfd','cat_buddhism'),  -- මළපොත් පිංච
  ('cmwdn41wj000l07lb2jq83xfd','cat_spirituality'),  -- මළපොත් පිංච
  ('cmwdn1lvw000g08l088gf7rj6','cat_society'),  -- ජපන් සොබාදහම් ගොවියා
  ('cmwdmxpvo000r08l8j61owwol','cat_spirituality'),  -- ඇස් පහ
  ('cmwdmv0sc000o08l8v3pz5ahb','cat_buddhism'),  -- වජ්‍රච්ඡේදිකා ප්‍රඥා පාරමිතා සූත්‍රය සහ ප්‍රඥා පාරමිතා හෘද සූත්‍රය
  ('cmwdmqbhj000l08l8ykmrq4tw','cat_spirituality'),  -- බාබාජි
  ('cmwdmqbhj000l08l8ykmrq4tw','cat_biography'),  -- බාබාජි
  ('cmwdmm6s9000i08l8ly2s2xp8','cat_society'),  -- පිදුරු ගහේ විප්ලවය
  ('cmwdmhwjz000d08l046610u4a','cat_spirituality'),  -- මහා මුද්‍රා ගීතය
  ('cmwdmhwjz000d08l046610u4a','cat_buddhism'),  -- මහා මුද්‍රා ගීතය
  ('cmwdmecld000a08l06z0pjog2','cat_buddhism'),  -- සුවර්ණ භාසෝත්තම සූත්‍රය
  ('cmwdmacwj000i07lbou9ip4l8','cat_buddhism'),  -- බුද්ධ ස්වභාවය
  ('cmwdm7uk9000f07lb8qyeflaz','cat_spirituality'),  -- සද්ගුණය හා යථාර්ථය
  ('cmwdm54h8000f08l8u24s9q8f','cat_spirituality'),  -- විඥාන භෛරව තන්ත්‍ර හෙවත් මධ්‍යගත කිරීමේ ක්‍රමවේදය
  ('cmwdm1d1l000708l0b1bj2fn7','cat_buddhism'),  -- මරණය හා විමුක්තිය පිළිබඳ පූජනීය ටිබැට් ඉගැන්වීම්
  ('cmwdlxsb7000408l05mgzgr58','cat_buddhism'),  -- සෙන් දහමට ප්‍රවේශයක්
  ('cmwdlxsb7000408l05mgzgr58','cat_spirituality'),  -- සෙන් දහමට ප්‍රවේශයක්
  ('cmwdlu7wp000c07lbrzy0jd9g','cat_buddhism'),  -- නව පූජා
  ('cmwdlnj7e000907lbu0gf4iyt','cat_spirituality'),  -- මහාමුද්‍රා ප්‍රාගුණ්‍ය මාලාව
  ('cmwdlnj7e000907lbu0gf4iyt','cat_buddhism'),  -- මහාමුද්‍රා ප්‍රාගුණ්‍ය මාලාව
  ('cmwdlka3o000607lbhlyr7mk9','cat_spirituality'),  -- අලුත් පොළොවක්
  ('cmwdlka3o000607lbhlyr7mk9','cat_self-help'),  -- අලුත් පොළොවක්
  ('cmwdlhesu000008l01bkqxt9c','cat_spirituality'),  -- මේ මොහොත සමඟ මිත්‍රවීම
  ('cmwdleyae000c08l8k649ey5g','cat_spirituality'),  -- ආලෝක මාර්ගය
  ('cmwdlajw7000307lb6tmo63ro','cat_spirituality'),  -- අද්වය සිද්ධි තන්ත්‍රය
  ('cmwdl6ani000908l8wq4hbl9s','cat_self-help'),  -- ආරම්භ කරන සෑම වැඩක්ම අවසන් කරන්නේ කෙසේද?
  ('cmwdl31rp000608l85uewabgs','cat_spirituality'),  -- සූවාසු සිද්ධ යෝගීහු
  ('cmwdl31rp000608l85uewabgs','cat_biography'),  -- සූවාසු සිද්ධ යෝගීහු
  ('cmwdl01yj000308l8j8bza2i2','cat_buddhism'),  -- ගුරු පද්ම සම්භව
  ('cmwdl01yj000308l8j8bza2i2','cat_biography'),  -- ගුරු පද්ම සම්භව
  ('cmwdkv6by000008l8rl3jdiu2','cat_buddhism'),  -- චිත්තාමාණික්‍ය රත්නය නම් වූ සංක්ෂිප්ත භෛෂජ්‍ය ගුරු බුද්ධ පූජාව
  ('cmwdkqr2d000008l6dzybkxvf','cat_buddhism'),  -- තිබ්බත මළපොත
  ('cmwdkk77t000007lbmkg3qefd','cat_buddhism'),  -- මහායාන බුදු දහම - 1
  ('cmwcfvotb000608jpln8yeiyw','cat_self-help'),  -- සාර්ථකත්වයේ විශිෂ්ට පියවර
  ('cmwcfsi46000308jppvf70qtf','cat_business'),  -- ප්‍රධාන විධායක දින සටහන්
  ('cmwcfowvw000908jxv79g6yz4','cat_biography'),  -- ඇඩොල්ෆ් හිට්ලර්
  ('cmwcflatr000608jx8cud2e3h','cat_self-help'),  -- යතිවරයෙකු ලෙස සිතන්න
  ('cmwcfhoxf000008jpmpcufzu7','cat_self-help'),  -- ඔබ බලවත්
  ('cmwcfehe4000i08jsmb32rsvf','cat_self-help'),  -- ජීවත්වීමේ කලාව
  ('cmwcfb746000308jxomhq619k','cat_self-help'),  -- බැරි බැරියාව
  ('cmwcf86ec000008jxex3eu498','cat_self-help'),  -- සාර්ථකත්වට ගැඹුරු අවධානයක්
  ('cmwcf5f10000f08js4hsanto2','cat_mind'),  -- නායිකන් ක්‍රියා පිළිවෙත
  ('cmwcf2c9r000c08jsrgmqmc75','cat_business'),  -- මුදල් සොයන මොළේ
  ('cmwceyct2000908jsg4w48e10','cat_biography'),  -- ඈන් ෆ්‍රෑන්ක් මතක සුවඳ
  ('cmwcetufp000608jsznc89jp9','cat_self-help'),  -- ලොකුවට හිතන්න
  ('cmwcer1pv000o08l88nkgww12','cat_society'),  -- ආසියාව හා ලෝක දේශපාලනය ලී ක්වාන් යූ අන්තර් දැක්ම
  ('cmwcen4p3000308jsh0s9at6a','cat_biography'),  -- අග්නි පියාපත්
  ('cmwcekgpq000008jspv9d05v3','cat_self-help'),  -- පුරුද්දක බලය
  ('cmwceh4jf000l08l853cfk2p6','cat_business'),  -- මිනිසුන් මෙහෙයවීමේ කලාව
  ('cmwceh4jf000l08l853cfk2p6','cat_self-help'),  -- මිනිසුන් මෙහෙයවීමේ කලාව
  ('cmwceczxg000i08l8h7tsan7o','cat_world-fiction'),  -- අම්මා
  ('cmwceak9q000f08l2cqtixih8','cat_world-fiction'),  -- වානේ පන්නරය ලැබූ හැටි
  ('cmwce45rr000c08l2p8l6ks00','cat_sinhala-lit'),  -- විජ්ජුලතාගේ තනේ
  ('cmwce17xb000f08l8s5hak3mw','cat_biography'),  -- මගේ වික්‍රමාන්විත ඇදහිල්ලේ ගමන
  ('cmwcdwaji000c08l8w96sw99y','cat_self-help'),  -- තම දෙපසින් නැඟී සිටින්නේ කෙසේද?
  ('cmwcdt5c1000908l8vbfsvcig','cat_children'),  -- උරා ගන්නා ළපැටි මනස
  ('cmwcdq3s4000908l2we0ioikw','cat_children'),  -- ජය ගන්නට ඔබේ දරුවාට උදව් කරන්නේ මෙහෙමයි
  ('cmwcdmo3u000608l2kn78xab7','cat_children'),  -- ඔබේ දරුවාට නව ලොවක්
  ('cmwcdjpf3000308l2l7v06mow','cat_self-help'),  -- ජීවිතයට පාඩම්
  ('cmwcdhio4001307ic6ltijpf0','cat_self-help'),  -- ආලෝකවත් ජීවිතයකට
  ('cmwcdexev001007ich6573pno','cat_buddhism'),  -- සසර සැරිසරන සිත
  ('cmwcdcks3000608l8aklgb9yi','cat_buddhism'),  -- සසර සුගතිය
  ('cmwcd9tgs000x07icmdhk1xbj','cat_business'),  -- ධනවත් පියා දිළිඳු පියා
  ('cmwcd6q7m000308l8ewuthje6','cat_world-fiction'),  -- චෙරි උයන
  ('cmwcd483x000008l25aahrf0l','cat_buddhism'),  -- තිබ්බත තාන්ත්‍රික සම්ප්‍රදාය
  ('cmwcd483x000008l25aahrf0l','cat_spirituality'),  -- තිබ්බත තාන්ත්‍රික සම්ප්‍රදාය
  ('cmwccxvul000308ldgqxyrird','cat_business'),  -- වැඩ කිරීමේ ගැටළු
  ('cmwccxvul000308ldgqxyrird','cat_self-help'),  -- වැඩ කිරීමේ ගැටළු
  ('cmwccuq1j000u07icm2v9qxo7','cat_world-fiction'),  -- වන පස කැකුළු
  ('cmwccs77u000r07ic9y94h1w4','cat_mind'),  -- ස්වයං යෝජනා රහස්
  ('cmwcclaon000008l8bvlic6g7','cat_mind'),  -- චිත්ත ධර්ම විද්‍යා පාඩම් මාලාව
  ('cmwccikdn000008ld8lgqjfcx','cat_mind'),  -- ලිංගික මනෝවිද්‍යා රහස්
  ('cmwccft87000o07icp6quzo4y','cat_world-fiction'),  -- සැබෑ මිනිසෙකුගේ කතාවක්
  ('cmwcccwnt000l07iczgu74j89','cat_mind'),  -- මිනිස් හිතේ හාස්කම් 10
  ('cmwccanoa000e08jyb7heeziz','cat_mind'),  -- මිනිස් හිතේ හාස්කම් 9
  ('cmwcc8sjl000i07icbgjlsw35','cat_mind'),  -- මිනිස් හිතේ හාස්කම් 8
  ('cmwcc6d7w000b08jy8t72z5tx','cat_mind'),  -- මිනිස් හිතේ හාස්කම් 7
  ('cmwcc3x25000f07icxmac6cnf','cat_mind'),  -- මිනිස් හිතේ හාස්කම් 6
  ('cmwcc1897000808jy663uxjue','cat_mind'),  -- මිනිස් හිතේ හාස්කම් 5
  ('cmwcbyp0p000c07icpoq6980s','cat_mind'),  -- මිනිස් හිතේ හාස්කම් 4
  ('cmwcbwz6f000v08l37zl4x02m','cat_mind'),  -- මිනිස් හිතේ හාස්කම් 3
  ('cmwcbuky3000508jyrxe475sd','cat_mind'),  -- මිනිස් හිතේ හාස්කම් 2
  ('cmwcbsdbm000s08l3cz1guy12','cat_mind'),  -- සාර්ථකත්වයේ පරම සත්‍යය
  ('cmwcbsdbm000s08l3cz1guy12','cat_self-help'),  -- සාර්ථකත්වයේ පරම සත්‍යය
  ('cmwcbpup0000907ichayogupy','cat_mind'),  -- ඥාන වින්දනය
  ('cmwcbn15w000607ic1qo1h0pe','cat_mind'),  -- ඉලක්කය හඹා යන චිත්ත බලය
  ('cmwcbn15w000607ic1qo1h0pe','cat_self-help'),  -- ඉලක්කය හඹා යන චිත්ත බලය
  ('cmwcbjibs000p08l3txl8f6d9','cat_sinhala-lit'),  -- පෙපර් මින්ට්
  ('cmwcba92l000m08l3iajtekd0','cat_self-help'),  -- The Game Of Life: and how to play it
  ('cmwcb769u000307icb0h1k1v7','cat_society'),  -- හෝමෝ ඩෙයුස්
  ('cmwcb4ff3000j08l3mzjqjoxk','cat_society'),  -- ආදරය දැනෙන්න ජීවත් වන්න
  ('cmwcb07c8000007icc693ooij','cat_biography'),  -- නොහඳුනන ලින්කන්
  ('cmwcaw727000g08l34u8e0a2r','cat_sinhala-lit'),  -- යුගාන්තය
  ('cmwcatpu2000008jy2rug214q','cat_sinhala-lit'),  -- කලියුගය
  ('cmwcarrjp001u08kwt5ct1wjs','cat_sinhala-lit'),  -- අංගනා
  ('cmwcapqok001r08kw3a4zg597','cat_sinhala-lit'),  -- හත්පණ
  ('cmwcapqok001r08kw3a4zg597','cat_children'),  -- හත්පණ
  ('cmwcane6k001o08kwpvcsxnoi','cat_world-fiction'),  -- පරාජිත ජීවිත
  ('cmwcakrwn001l08kw7ppfwu5c','cat_world-fiction'),  -- බිඳුණු සඳ
  ('cmwcah4qz001i08kwhw6fu8k8','cat_world-fiction'),  -- රාගිනි
  ('cmwcaepzi000d08l3eo91q2ri','cat_world-fiction'),  -- ඕලන්ද නෞකාව: ෂර්ලොක් හෝම්ස්ගේ රහසිගත ලිපිගොනු 14
  ('cmwcaamml000a08l3adv4awem','cat_buddhism'),  -- ජාතක කතා
  ('cmwcaamml000a08l3adv4awem','cat_folk'),  -- ජාතක කතා
  ('cmwca7r73000708l3pziq6ja3','cat_sinhala-lit'),  -- චපල සඳ
  ('cmwca4bu1001f08kwi4evu2zb','cat_sinhala-lit'),  -- ආදරණීය වික්ටෝරියා
  ('cmwca1c3z001c08kw54jx7krs','cat_sinhala-lit'),  -- පිච්චමල
  ('cmwc9vu9m000408l3cmmpkff4','cat_world-fiction'),  -- ධීමතී
  ('cmwc9t2fj001908kw494u66ph','cat_world-fiction'),  -- කපිතන්ගේ දියැණියෝ
  ('cmwc9ph1r000m08l48lckw4w1','cat_sinhala-lit'),  -- පර්සෝනා
  ('cmwc9md61001608kw9f87r846','cat_world-fiction'),  -- ආදරවන්තයා
  ('cmwc9iywt000i08l48mvqu92y','cat_buddhism'),  -- කෙලෙස් එක්දහස් පන්සියය
  ('cmwc9eyox001308kwixf8dk79','cat_world-fiction'),  -- විදේශීය කෙටිකතා සංග්‍රහය
  ('cmwc9ar2h000f08l45rq2bxy2','cat_sinhala-lit'),  -- බව තරණය
  ('cmwc9ar2h000f08l45rq2bxy2','cat_buddhism'),  -- බව තරණය
  ('cmwc98fle000c08l44pn7dfvn','cat_self-help'),  -- සාර්ථකත්ව මූලධර්ම
  ('cmwc94vem001008kwgfn2aixa','cat_biography'),  -- නොක්ස් නොදුටු ලක්දිව
  ('cmwc9221u000x08kwsa8u2m94','cat_world-fiction'),  -- අපූරු මිනිසෙක්
  ('cmwc8y8hx000u08kwt64bzo1s','cat_self-help'),  -- Atomic Habits දකින්න වෙනස්ව ජීවිතය
  ('cmwc8uy41000r08kw8nhtcrob','cat_business'),  -- ධනවත් වීමේ නොවරදින රහස්
  ('cmwc8uy41000r08kw8nhtcrob','cat_self-help'),  -- ධනවත් වීමේ නොවරදින රහස්
  ('cmwc8pwgv000o08kwtftunurz','cat_sinhala-lit'),  -- ඒ දවස් හරි වෙනස්
  ('cmwc8k0kn000008l3jafzkux8','cat_world-fiction'),  -- අපරාධය සහ දඬුවම
  ('cmwc8hel7000l08kwjda0hs8v','cat_world-fiction'),  -- එමා බෝවාරි
  ('cmwc8e8dz000i08kwck1sp1i5','cat_biography'),  -- මහා පුරුෂයෙකුට බිරිඳක්ව
  ('cmwc8bb70000f08kw1t7xgfnr','cat_sinhala-lit'),  -- මාණික් කාවත
  ('cmwc87xcq000908l4jsqs11r8','cat_sinhala-lit'),  -- මුන්නක්කරේ සංසාරේ
  ('cmwc84nhq000c07jnlx26e29w','cat_sinhala-lit'),  -- කුර හඬෙකි වියැකෙන
  ('cmwc81yfd000c08kwq4fbyqp7','cat_world-fiction'),  -- ඇමසෝනියා
  ('cmwc7ymki000908kwvfpl9sqr','cat_sinhala-lit'),  -- ගම්පෙරළිය
  ('cmwc7w0ei000907jnsiaz3p8i','cat_world-fiction'),  -- ආයුබෝවන් ගෘෂෝවිකා!
  ('cmwc7qgp4000608l4y6q47gg7','cat_world-fiction'),  -- සියක් වසක හුදකලාව
  ('cmwc7m7tg000308l48rqiaphr','cat_world-fiction'),  -- චැටර්ලි ආර්යාවගේ පෙම්වතා
  ('cmwc7ijew000608kw3mfbmxs3','cat_sinhala-lit'),  -- දස්කොන් ප්‍රමිලා
  ('cmwc7f53o000308kw6uap9jfa','cat_buddhism'),  -- යේසුස් නම් බුද්ධ ශ්‍රාවකයාණෝ
  ('cmwc77jri000008l45ej4ilxw','cat_sinhala-lit'),  -- මැයි මාර ප්‍රසංගය
  ('cmwc732cr000008kw1mcnd2oe','cat_spirituality'),  -- අධ්‍යාත්මයේ ස්වයංවරය
  ('cmwc6w1tr000607jnio131r0f','cat_sinhala-lit'),  -- සොංකොට්ටං
  ('cmwc6ohtj000307jn9d6fkfb1','cat_world-fiction'),  -- THE ALCHEMIST
  ('cmwc6c0c2000c08l79qhsl31j','cat_sinhala-lit'),  -- මාතාභාරි
  ('cmwc67q6g000908l7snvr18rm','cat_world-fiction'),  -- සිහිනයක රැඳි රහසක්
  ('cmwc632sa000608l70ftuziyk','cat_world-fiction'),  -- මෙතන තමයි තැන
  ('cmwc5ylbl000008l7bx242ltx','cat_world-fiction'),  -- ගිනි දියණි
  ('cmwc5tyx4000007jn4uj583xv','cat_sinhala-lit'),  -- තුංමං හන්දිය
  ('cmwc5q4zt000008l7sg05919o','cat_world-fiction'),  -- ආදරය බලා ඉඳී
  ('cmwb24q4x000607lkvxqju7go','cat_buddhism'),  -- ආනාපාන සති සූත්‍රය
  ('cmwb24q4x000607lkvxqju7go','cat_spirituality'),  -- ආනාපාන සති සූත්‍රය
  ('cmwb1yyxg000907jvuena4h51','cat_self-help'),  -- ඉකිගායි
  ('cmwb1tiqb000207lk4hr75el0','cat_self-help'),  -- ආ මග දැන පෙර මග සකසමු
  ('cmwb1e1mb000607jvhqyk7jdt','cat_spirituality'),  -- යෝගි ජීවිතයට දොරටුව
  ('cmwb1ddfr000307jvmpyojqyg','cat_world-fiction'),  -- මනුතාපය
  ('cmwb151xs000007jvustb7f4s','cat_sinhala-lit'),  -- නන්ද හා සරණ
  ('cmwav6hst000004l8z1092a67','cat_self-help'),  -- කම්මැළි මොළේ
  ('cmwav6hst000004l8z1092a67','cat_mind'),  -- කම්මැළි මොළේ
  ('cmwau703f001604l292w7t6hl','cat_sinhala-lit'),  -- අපේ ගම
  ('cmwau703f001604l292w7t6hl','cat_biography'),  -- අපේ ගම
  ('cmwasz6w0000904kuojgqi3zz','cat_world-fiction'),  -- කාන්තාරයේ කුසුම
  ('cmwasz6w0000904kuojgqi3zz','cat_biography'),  -- කාන්තාරයේ කුසුම
  ('cmwapxpxf000004jqde8cdecr','cat_self-help'),  -- 11:11
  ('cmss1ds7a0000is4p3puztfbd','cat_sinhala-lit')  -- සීනි මුරුක්කු
) AS t("bookId","categoryId")
JOIN "Book" b ON b."id" = t."bookId"
ON CONFLICT DO NOTHING;

COMMIT;

-- Check: number of books in each category.
-- SELECT c."nameEn", count(bc."bookId") FROM "Category" c
--   LEFT JOIN "BookCategory" bc ON bc."categoryId" = c."id"
--   GROUP BY c."nameEn", c."position" ORDER BY c."position";
