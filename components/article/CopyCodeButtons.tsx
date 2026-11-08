"use client";

import { useEffect } from "react";

export function CopyCodeButtons() {
  useEffect(() => {
    const handleCopy = (btn: HTMLButtonElement) => {
      const code = btn.getAttribute("data-code") || "";
      navigator.clipboard.writeText(code).then(() => {
        btn.classList.add("copied");
        btn.setAttribute("data-tooltip", "Copied!");

        setTimeout(() => {
          btn.classList.remove("copied");
          btn.setAttribute("data-tooltip", "Copy");
        }, 2000);
      }).catch((err) => {
        console.error("Failed to copy:", err);
        btn.setAttribute("data-tooltip", "Failed!");
        setTimeout(() => {
          btn.setAttribute("data-tooltip", "Copy");
        }, 2000);
      });
    };

    const onClick = (e: MouseEvent) => {
      const btn = (e.target as Element).closest(".copy-btn") as HTMLButtonElement;
      if (btn) {
        handleCopy(btn);
      }
    };

    // Use event delegation for better performance and to handle dynamic content
    document.addEventListener("click", onClick);

    // Set initial tooltip on all buttons
    document.querySelectorAll<HTMLButtonElement>(".copy-btn").forEach((btn) => {
      btn.setAttribute("data-tooltip", "Copy");
    });

    return () => {
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
