import { Link } from "react-router-dom";
import technologyBanner from "../../assets/banners/image2.png";
import electronicsBanner from "../../assets/banners/image3.png";

const promotions = [
  {
    side: "left-[10px]",
    image: technologyBanner,
    imagePosition: "65% center",
    eyebrow: "FLASH SALE",
    title: "Deal công nghệ",
    discount: "Từ 99K",
    accent: "from-[#ee4d2d]/95 via-orange-600/80 to-orange-950/85",
    label: "Xem deal công nghệ từ 99 nghìn",
    effectDelay: "0s",
  },
  {
    side: "right-[10px]",
    image: electronicsBanner,
    imagePosition: "72% center",
    eyebrow: "FREESHIP",
    title: "Sale điện tử",
    discount: "-50%",
    accent: "from-orange-500/90 via-[#ee4d2d]/78 to-red-950/88",
    label: "Xem sale điện tử giảm đến 50 phần trăm",
    effectDelay: "1.35s",
  },
];

export default function SidePromotionBanners() {
  return promotions.map((promotion) => (
    <Link
      key={promotion.side}
      to="/products"
      aria-label={promotion.label}
      className={`side-promo-ad group fixed bottom-[10px] top-[74px] z-30 hidden w-[clamp(28px,calc((100vw_-_1280px)/2_+_24px),112px)] overflow-hidden rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.22),0_5px_16px_rgba(238,77,45,0.16)] transition duration-300 hover:scale-[1.015] xl:block 2xl:rounded-3xl ${promotion.side}`}
      style={{ "--side-ad-delay": promotion.effectDelay }}
    >
      <img
        src={promotion.image}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        style={{ objectPosition: promotion.imagePosition }}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-b ${promotion.accent}`}
      />
      <div className="absolute inset-x-3 top-3 h-16 rounded-full bg-white/20 blur-2xl" />
      <div
        aria-hidden="true"
        className="side-promo-shine absolute -bottom-1/4 -top-1/4 z-[3] w-10 -skew-x-12 bg-gradient-to-r from-transparent via-white/80 to-transparent blur-sm"
      />
      <div
        aria-hidden="true"
        className="side-promo-flare absolute left-1/2 top-1/3 z-[3] h-20 w-20 -translate-x-1/2 rounded-full bg-yellow-300/30 blur-2xl"
      />

      <div className="relative hidden h-full flex-col items-center justify-between px-2 py-4 text-center text-white min-[1360px]:flex 2xl:px-3 2xl:py-5">
        <div className="space-y-2">
          <span className="side-promo-eyebrow inline-flex rounded-full border border-white/35 bg-white/20 px-1.5 py-1 text-[7px] font-black tracking-[0.08em] backdrop-blur-md 2xl:px-2.5 2xl:text-[9px] 2xl:tracking-[0.12em]">
            {promotion.eyebrow}
          </span>
          <p className="text-[11px] font-black uppercase leading-tight drop-shadow-md 2xl:text-base">
            {promotion.title}
          </p>
        </div>

        <div className="side-promo-discount grid h-14 w-14 place-items-center rounded-full border border-white/35 bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_10px_28px_rgba(0,0,0,0.22)] backdrop-blur-lg 2xl:h-20 2xl:w-20">
          <span className="text-sm font-black text-yellow-300 drop-shadow-md 2xl:text-xl">
            {promotion.discount}
          </span>
        </div>

        <span className="side-promo-cta rounded-lg bg-white px-2 py-1.5 text-[8px] font-black text-[#ee4d2d] shadow-lg transition group-hover:bg-yellow-300 2xl:rounded-xl 2xl:px-3 2xl:py-2 2xl:text-[10px]">
          MUA →
        </span>
      </div>
    </Link>
  ));
}
