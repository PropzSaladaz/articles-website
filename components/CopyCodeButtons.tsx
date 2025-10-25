"use client";

import { useEffect } from "react";

export function CopyCodeButtons() {
  useEffect(() => {
    const buttons = document.querySelectorAll<HTMLButtonElement>(".copy-btn");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const code = btn.getAttribute("data-code") || "";
        navigator.clipboard.writeText(code).then(() => {
          btn.textContent = "Copied!";
          btn.classList.add("copied");
          setTimeout(() => {
            btn.textContent = "Copy";
            btn.classList.remove("copied");
          }, 1200);
        });
      });
    });

    return () => {
      buttons.forEach((btn) => {
        const clone = btn.cloneNode(true);
        btn.replaceWith(clone); // remove listeners on unmount
      });
    };
  }, []);

  return null; // this component renders nothing, it only activates the JS
}
