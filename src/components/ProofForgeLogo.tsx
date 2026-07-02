"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHammer } from "@fortawesome/free-solid-svg-icons";

/**
 * Logo lockup = one ready-made FontAwesome icon (hammer) + plain text "ProofForge".
 * No custom vector paths. Icon: faHammer from @fortawesome/free-solid-svg-icons.
 */
export function ProofForgeLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-forge text-white shadow-panel">
        <FontAwesomeIcon icon={faHammer} className="h-[17px] w-[17px]" />
      </span>
      {!compact && (
        <span className="text-[1.1rem] font-bold leading-none tracking-tight text-ink">
          Proof<span className="text-forge">Forge</span>
        </span>
      )}
    </span>
  );
}
