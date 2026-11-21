import { useEffect, useRef, useSyncExternalStore } from "react";
import { omniIndex, OmniNode } from "../core/omni-index";
import { HolyLinter, WithOmniHeart } from "../core/omni-linter";


/**
 * 萬能智庫 React Hook：元件層級的生命週期綁定
 * 負責在元件 Mount/Update/Unmount 時，自動寫入 Omni Index Keeper。
 */
export function useOmniIndex<T extends object>(
  nodeId: string,
  data: T,
  origin: string,
  actor: string = "SYSTEM_UI"
) {
  const isMinted = useRef(false);
  
  const omniNode = useSyncExternalStore(
    (l) => omniIndex.subscribe(l),
    () => omniIndex.getNode(nodeId) || null
  );

  useEffect(() => {
    // side effects for minting/evolving in the background
    let sealedData: WithOmniHeart<T>;
    if (HolyLinter.verify(data)) {
      sealedData = data as WithOmniHeart<T>;
    } else {
      sealedData = HolyLinter.seal(data, origin, true);
    }

    if (!isMinted.current) {
      if (!omniNode) {
        omniIndex.mintNode(nodeId, "component", sealedData, actor);
      } else {
        omniIndex.evolveNode(nodeId, "RENDERED", actor, "Component mounted and rendered");
      }
      isMinted.current = true;
    } else {
      omniIndex.evolveNode(nodeId, "INTERACTED", actor, "Component data updated");
    }


    // 3. 卸載時清理紀錄
    return () => {
      omniIndex.evolveNode(nodeId, "UNMOUNTED", actor, "Component unmounted");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, data, origin, actor]);

  return {
    nodeId,
    omniNode,
    getLatestNode: () => omniIndex.getNode(nodeId),
    evolve: (event: "MAPPED" | "VERIFIED" | "TRANSFERRED" | "INTERACTED", details: string) => {
      return omniIndex.evolveNode(nodeId, event, actor, details);
    }
  };

}
