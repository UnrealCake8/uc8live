import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { Radio, UserRound } from 'lucide-react'
import '../styles.css'
export const Route=createRootRoute({head:()=>({meta:[{charSet:'utf-8'},{name:'viewport',content:'width=device-width, initial-scale=1'},{title:'uc8Live — Broadcast your moment'}]}),component:Root})
function Root(){return <html lang="en"><head><HeadContent/></head><body><header className="topbar"><Link to="/" className="brand"><span className="signal"><i/><i/><i/></span><b>uc8</b>Live</Link><nav><Link to="/live">Explore live</Link><Link to="/creator">Creator Hub</Link><Link to="/login" className="navButton"><UserRound size={16}/> Sign in</Link></nav></header><Outlet/><footer className="footer"><span>© 2026 uc8Live</span><span><Radio size={14}/> Powered by Mux Video</span></footer><Scripts/></body></html>}
