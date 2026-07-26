import { Radio } from "lucide-react";

export function BrandInline() { return <a href="/live/" className="brand"><span className="brandMark"><i/><i/><i/></span><b>uc8</b>Live</a>; }

export function SiteHeader() {
  return <header className="siteHeader"><BrandInline/><nav><a className="active" href="/live/">Browse</a></nav><a className="goLive" href="/creator/live"><Radio size={15}/><span>Go live</span></a></header>;
}
