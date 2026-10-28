import type { AnchorHTMLAttributes } from "react";
import { getPathForView, type ViewType } from "./routes";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { view: ViewType };

// Keep native links available to crawlers, new tabs and JavaScript-free navigation.
export function NavigationLink({ view, onClick, ...props }: Props) {
  return <a {...props} href={getPathForView(view)} onClick={event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (onClick) {
      event.preventDefault();
      onClick(event);
    }
  }} />;
}
