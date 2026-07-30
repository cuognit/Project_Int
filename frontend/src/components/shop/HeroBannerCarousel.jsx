import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import promotionCollectionBanner from "../../assets/banners/image.png";
import orangeDaysBanner from "../../assets/banners/image1.png";
import technologyDealsBanner from "../../assets/banners/image2.png";
import electronicsSaleBanner from "../../assets/banners/image3.png";
import {
  getSwipeDirection,
  wrapCarouselIndex,
} from "../../utils/carousel.js";

const AUTOPLAY_DELAY_MS = 3_000;

const slides = [
  {
    imageName: "image1.png",
    imageSrc: orangeDaysBanner,
    label: "Orange Days - Săn deal mỗi ngày, mua 2 tặng 1",
    to: "/products",
    gradient: "from-orange-100 via-orange-300 to-orange-600",
  },
  {
    imageName: "image2.png",
    imageSrc: technologyDealsBanner,
    label: "Flash Sale cuối tuần - Deal công nghệ cực chất",
    to: "/products",
    gradient: "from-orange-700 via-orange-500 to-amber-200",
  },
  {
    imageName: "image3.png",
    imageSrc: electronicsSaleBanner,
    label: "Sale điện tử - Giảm đến 50%, miễn phí vận chuyển",
    to: "/products",
    gradient: "from-orange-800 via-orange-500 to-yellow-300",
  },
  {
    imageName: "image.png",
    imageSrc: promotionCollectionBanner,
    label: "Tổng hợp ưu đãi công nghệ và ShopeeMart",
    to: "/products",
    gradient: "from-blue-950 via-orange-500 to-slate-950",
  },
];

export default function HeroBannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [documentHidden, setDocumentHidden] = useState(document.hidden);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [brokenImages, setBrokenImages] = useState(() => new Set());
  const pointerStartX = useRef(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener?.("change", updatePreference);
    return () => mediaQuery.removeEventListener?.("change", updatePreference);
  }, []);

  useEffect(() => {
    const handleVisibility = () => setDocumentHidden(document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (documentHidden || reducedMotion) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setCurrentIndex((index) => wrapCarouselIndex(index + 1, slides.length));
    }, AUTOPLAY_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [currentIndex, documentHidden, reducedMotion]);

  const goToSlide = (index) => {
    setCurrentIndex(wrapCarouselIndex(index, slides.length));
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === "mouse") return;
    pointerStartX.current = event.clientX;
  };

  const handlePointerUp = (event) => {
    if (pointerStartX.current === null) return;
    const direction = getSwipeDirection(pointerStartX.current, event.clientX);
    pointerStartX.current = null;
    if (direction) goToSlide(currentIndex + direction);
  };

  return (
    <section
      ref={carouselRef}
      className={`hero-promo-carousel group relative overflow-hidden rounded-3xl bg-white text-white shadow-[0_20px_55px_rgba(15,23,42,0.18),0_6px_18px_rgba(238,77,45,0.10)] outline-none ${
        reducedMotion ? "hero-promo-reduced-motion" : ""
      }`}
      aria-roledescription="carousel"
      aria-label="Ưu đãi nổi bật"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goToSlide(currentIndex - 1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          goToSlide(currentIndex + 1);
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStartX.current = null;
      }}
      style={{ touchAction: "pan-y" }}
    >
      <div
        className={`flex ${
          reducedMotion
            ? ""
            : "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
        }`}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        aria-live="off"
      >
        {slides.map((slide, index) => {
          const imageSrc = slide.imageSrc;
          const showImage = imageSrc && !brokenImages.has(slide.imageName);
          return (
            <article
              key={slide.imageName}
              className={`hero-promo-slide relative min-w-full overflow-hidden bg-gradient-to-br ${slide.gradient} ${
                index === currentIndex && !reducedMotion ? "hero-promo-slide-active" : ""
              }`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} trên ${slides.length}`}
              aria-hidden={index !== currentIndex}
            >
              {showImage && (
                <img
                  src={imageSrc}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-2xl"
                />
              )}
              <div className="relative aspect-[12/5] min-h-[160px] w-full sm:min-h-[240px] lg:min-h-[360px]">
                {showImage ? (
                  <img
                    src={imageSrc}
                    alt={slide.label}
                    className="hero-promo-image absolute inset-0 h-full w-full object-contain motion-safe:transition-transform motion-safe:duration-700 motion-safe:ease-out motion-safe:group-hover:scale-[1.025]"
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    onError={() =>
                      setBrokenImages((current) => {
                        const next = new Set(current);
                        next.add(slide.imageName);
                        return next;
                      })
                    }
                  />
                ) : (
                  <div className="grid h-full place-items-center px-8 text-center text-sm font-bold text-white/90">
                    Không thể tải {slide.imageName}
                  </div>
                )}
                {index === currentIndex && !reducedMotion && (
                  <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden="true">
                    <div className="hero-promo-glow absolute left-1/2 top-1/2 h-3/4 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300/25 blur-3xl" />
                    <div className="hero-promo-shine absolute -bottom-1/3 -top-1/3 w-1/5 -skew-x-12 bg-gradient-to-r from-transparent via-white/75 to-transparent blur-md" />
                    <span className="hero-promo-sparkle hero-promo-sparkle-one absolute left-[8%] top-[16%]" />
                    <span className="hero-promo-sparkle hero-promo-sparkle-two absolute right-[12%] top-[22%]" />
                    <span className="hero-promo-sparkle hero-promo-sparkle-three absolute bottom-[18%] left-[18%]" />
                  </div>
                )}
                <Link
                  to={slide.to}
                  tabIndex={index === currentIndex ? 0 : -1}
                  className="absolute inset-0 z-10 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
                  aria-label={`${slide.label} - Xem sản phẩm`}
                />
              </div>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => goToSlide(currentIndex - 1)}
        className="absolute left-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center overflow-hidden rounded-full border border-white/45 bg-white/20 text-3xl font-light text-white shadow-[0_8px_32px_rgba(15,23,42,0.28),inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-xl backdrop-saturate-150 transition duration-300 before:absolute before:inset-x-1 before:top-1 before:h-1/2 before:rounded-full before:bg-gradient-to-b before:from-white/45 before:to-transparent hover:scale-110 hover:border-white/70 hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:left-5 sm:h-12 sm:w-12"
        aria-label="Banner trước"
      >
        <span className="relative z-10 -translate-y-px" aria-hidden="true">
          ‹
        </span>
      </button>

      <button
        type="button"
        onClick={() => goToSlide(currentIndex + 1)}
        className="absolute right-3 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center overflow-hidden rounded-full border border-white/45 bg-white/20 text-3xl font-light text-white shadow-[0_8px_32px_rgba(15,23,42,0.28),inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-xl backdrop-saturate-150 transition duration-300 before:absolute before:inset-x-1 before:top-1 before:h-1/2 before:rounded-full before:bg-gradient-to-b before:from-white/45 before:to-transparent hover:scale-110 hover:border-white/70 hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-5 sm:h-12 sm:w-12"
        aria-label="Banner tiếp theo"
      >
        <span className="relative z-10 -translate-y-px" aria-hidden="true">
          ›
        </span>
      </button>

      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center gap-2 overflow-hidden rounded-full border border-white/40 bg-white/20 px-3 py-2 shadow-[0_8px_28px_rgba(15,23,42,0.25),inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-xl backdrop-saturate-150 sm:bottom-4">
        {slides.map((slide, index) => (
          <button
            key={slide.imageName}
            type="button"
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? "hero-promo-indicator-active w-7 bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                : "w-2 bg-white/45 hover:bg-white/80"
            }`}
            aria-label={`Chuyển đến banner ${index + 1}`}
            aria-current={index === currentIndex ? "true" : undefined}
          />
        ))}
      </div>
    </section>
  );
}
