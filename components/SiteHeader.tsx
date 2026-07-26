import { Radio, Search } from "lucide-react";

export function BrandInline() { return <a href="/live/" className="brand"><span className="brandMark"><i/><i/><i/></span><b>uc8</b>Live</a>; }

export function SiteHeader() {
  return <header className="siteHeader"><BrandInline/><nav><a className="active" href="/live/">Browse</a><a href="/live/late-afternoon">Following</a></nav><div className="search"><Search size={17}/><input aria-label="Search live rooms" placeholder="Search live rooms"/></div><a className="goLive" href="/creator/live"><Radio size={15}/> Go live</a></header>;
}
