(function () {
  const root = document.documentElement;
  const storageKey = "portfolio-theme";
  const buttons = Array.from(document.querySelectorAll(".theme-toggle"));

  const setTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    window.localStorage.setItem(storageKey, theme);
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(theme === "dark"));
    });
  };

  const storedTheme = window.localStorage.getItem(storageKey);
  const preferredTheme =
    storedTheme ||
    (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  setTheme(preferredTheme);

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(nextTheme);
    });
  });

  const toast = document.querySelector(".copy-toast");
  let toastTimer;

  const showToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 2200);
  };

  document.querySelectorAll(".contact-copy-trigger").forEach((button) => {
    button.addEventListener("click", async () => {
      const value = button.getAttribute("data-copy-value") || "";
      const label = button.getAttribute("data-copy-label") || "Value";

      try {
        await navigator.clipboard.writeText(value);
        showToast(`${label} copied`);
      } catch (_error) {
        showToast(`Could not copy ${label.toLowerCase()}`);
      }
    });
  });

  document.querySelectorAll(".hotspot-widget").forEach((widget) => {
    const dots = Array.from(widget.querySelectorAll(".hotspot-dot"));
    const panels = Array.from(widget.querySelectorAll(".hotspot-panel"));
    const progressBar = widget.querySelector(".hotspot-progress-bar");
    const rotationSeconds = Number(widget.getAttribute("data-rotation-seconds")) || 10;
    const duration = rotationSeconds * 1000;

    if (!dots.length || dots.length !== panels.length || !progressBar) return;

    let activeIndex = 0;
    let startedAt = performance.now();
    let rafId = 0;
    let paused = false;
    let elapsedBeforePause = 0;

    const setActive = (index, restart = true) => {
      activeIndex = index;
      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle("is-active", dotIndex === activeIndex);
      });
      panels.forEach((panel, panelIndex) => {
        panel.classList.toggle("is-active", panelIndex === activeIndex);
      });
      if (restart) startedAt = performance.now();
    };

    const tick = (now) => {
      if (!paused) {
        const elapsed = now - startedAt;
        const progress = Math.min(elapsed / duration, 1);
        progressBar.style.width = `${progress * 100}%`;
        if (elapsed >= duration) {
          setActive((activeIndex + 1) % dots.length);
        }
      }
      rafId = window.requestAnimationFrame(tick);
    };

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        paused = false;
        elapsedBeforePause = 0;
        setActive(index);
      });
      dot.addEventListener("focus", () => {
        paused = false;
        elapsedBeforePause = 0;
        setActive(index);
      });
      dot.addEventListener("mouseenter", () => {
        elapsedBeforePause = performance.now() - startedAt;
        paused = true;
        setActive(index, false);
      });
      dot.addEventListener("mouseleave", () => {
        startedAt = performance.now() - elapsedBeforePause;
        paused = false;
      });
    });

    setActive(0);
    rafId = window.requestAnimationFrame(tick);

    window.addEventListener("beforeunload", () => {
      window.cancelAnimationFrame(rafId);
    });
  });

  document.querySelectorAll(".hotspot-scene-reveal").forEach((section) => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            section.classList.add("is-visible");
            observer.unobserve(section);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    observer.observe(section);
  });

  const scrollRevealBlocks = Array.from(document.querySelectorAll(".scroll-reveal-block"));
  if (scrollRevealBlocks.length) {
    const revealOnScroll = () => {
      if (window.scrollY > 8) {
        scrollRevealBlocks.forEach((block) => block.classList.add("is-visible"));
        window.removeEventListener("scroll", revealOnScroll);
        window.removeEventListener("wheel", revealOnScroll);
        window.removeEventListener("touchmove", revealOnScroll);
      }
    };

    window.addEventListener("scroll", revealOnScroll, { passive: true });
    window.addEventListener("wheel", revealOnScroll, { passive: true });
    window.addEventListener("touchmove", revealOnScroll, { passive: true });
  }

  const imageModal = document.querySelector(".image-modal");
  const imageModalContent = imageModal?.querySelector(".image-modal-content");
  const imageModalStage = imageModal?.querySelector(".image-modal-stage");
  const imageModalTooltip = imageModal?.querySelector(".image-modal-tooltip");
  const imageModalClose = imageModal?.querySelector(".image-modal-close");
  const modalTooltipGap = 18;

  const positionModalTooltip = (dot) => {
    if (!imageModalTooltip) return;

    const dotRect = dot.getBoundingClientRect();
    const tooltipRect = imageModalTooltip.getBoundingClientRect();
    const viewportPadding = 16;

    let left = dotRect.right + modalTooltipGap;
    let top = dotRect.top + dotRect.height / 2 - tooltipRect.height / 2;

    if (left + tooltipRect.width > window.innerWidth - viewportPadding) {
      left = dotRect.left - tooltipRect.width - modalTooltipGap;
    }

    if (left < viewportPadding) {
      left = viewportPadding;
    }

    if (top + tooltipRect.height > window.innerHeight - viewportPadding) {
      top = window.innerHeight - tooltipRect.height - viewportPadding;
    }

    if (top < viewportPadding) {
      top = viewportPadding;
    }

    imageModalTooltip.style.left = `${left}px`;
    imageModalTooltip.style.top = `${top}px`;
    imageModalTooltip.style.transform = "none";
  };

  const closeImageModal = () => {
    if (!imageModal || !imageModalStage || !imageModalTooltip) return;
    imageModal.classList.remove("is-open");
    imageModal.setAttribute("aria-hidden", "true");
    imageModalStage.innerHTML = "";
    imageModalTooltip.innerHTML = "";
    imageModalTooltip.hidden = true;
  };

  document.querySelectorAll(".hotspot-visual-zoomable img").forEach((image) => {
    const visual = image.closest(".hotspot-visual-zoomable");
    const widget = image.closest(".hotspot-widget");

    image.addEventListener("mouseenter", () => {
      visual?.classList.add("is-image-hovered");
    });

    image.addEventListener("mouseleave", () => {
      visual?.classList.remove("is-image-hovered");
    });

    image.addEventListener("click", () => {
      if (!imageModal || !imageModalStage || !imageModalTooltip || !imageModalContent || !visual || !widget) return;
      const clonedVisual = visual.cloneNode(true);
      const panels = Array.from(widget.querySelectorAll(".hotspot-panel"));
      const naturalWidth = image.naturalWidth || 1200;

      clonedVisual.classList.remove("hotspot-visual-zoomable", "is-image-hovered");
      imageModalStage.innerHTML = "";
      imageModalStage.appendChild(clonedVisual);
      imageModalContent.style.setProperty("--modal-width", `${naturalWidth * 1.5}px`);

      const clonedDots = Array.from(clonedVisual.querySelectorAll(".hotspot-dot"));
      clonedDots.forEach((dot, index) => {
        dot.addEventListener("mouseenter", () => {
          const panel = panels[index];
          if (!panel) return;
          clonedDots.forEach((otherDot, otherIndex) => {
            otherDot.classList.toggle("is-active", otherIndex === index);
          });
          imageModalTooltip.innerHTML = panel.innerHTML;
          imageModalTooltip.hidden = false;
          positionModalTooltip(dot);
        });

        dot.addEventListener("mouseleave", () => {
          imageModalTooltip.hidden = true;
        });
      });

      imageModal.classList.add("is-open");
      imageModal.setAttribute("aria-hidden", "false");
    });
  });

  imageModalClose?.addEventListener("click", closeImageModal);
  imageModal?.addEventListener("click", closeImageModal);

  document.querySelectorAll(".gallery-carousel").forEach((carousel) => {
    const slides = Array.from(carousel.querySelectorAll(".gallery-slide"));
    const prevButton = carousel.querySelector(".gallery-nav-prev");
    const nextButton = carousel.querySelector(".gallery-nav-next");
    const lightbox = document.querySelector(".gallery-lightbox");
    const lightboxImg = lightbox?.querySelector(".gallery-lightbox-img");
    const lightboxClose = lightbox?.querySelector(".gallery-lightbox-close");

    if (!slides.length) return;

    let activeIndex = 0;

    const renderSlides = () => {
      slides.forEach((slide, index) => {
        const isActive = index === activeIndex;
        const isPrev = index === (activeIndex - 1 + slides.length) % slides.length;
        const isNext = index === (activeIndex + 1) % slides.length;

        slide.classList.toggle("is-active", isActive);
        slide.classList.toggle("is-prev", isPrev);
        slide.classList.toggle("is-next", isNext);
      });
    };

    const openLightbox = (src, alt) => {
      if (!lightbox || !lightboxImg) return;
      lightboxImg.setAttribute("src", src);
      lightboxImg.setAttribute("alt", alt || "");
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
    };

    const closeLightbox = () => {
      if (!lightbox || !lightboxImg) return;
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      lightboxImg.removeAttribute("src");
      lightboxImg.removeAttribute("alt");
    };

    prevButton?.addEventListener("click", () => {
      activeIndex = (activeIndex - 1 + slides.length) % slides.length;
      renderSlides();
    });

    nextButton?.addEventListener("click", () => {
      activeIndex = (activeIndex + 1) % slides.length;
      renderSlides();
    });

    slides.forEach((slide, index) => {
      slide.addEventListener("click", () => {
        if (index !== activeIndex) {
          activeIndex = index;
          renderSlides();
          return;
        }

        const image = slide.querySelector("img");
        if (!image) return;
        openLightbox(image.getAttribute("src") || "", image.getAttribute("alt") || "");
      });
    });

    lightboxClose?.addEventListener("click", closeLightbox);
    lightbox?.addEventListener("click", closeLightbox);

    window.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        activeIndex = (activeIndex - 1 + slides.length) % slides.length;
        renderSlides();
      }
      if (event.key === "ArrowRight") {
        activeIndex = (activeIndex + 1) % slides.length;
        renderSlides();
      }
      if (event.key === "Escape") {
        closeLightbox();
      }
    });

    renderSlides();
  });
})();
