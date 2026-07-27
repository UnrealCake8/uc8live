import { HeadContent, Link, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import { Radio } from 'lucide-react'
import { AuthNav } from '@/components/AuthNav'
import '../styles.css'
export const Route=createRootRoute({head:()=>({meta:[{charSet:'utf-8'},{name:'viewport',content:'width=device-width, initial-scale=1'},{title:'uc8Live — Broadcast your moment'}]}),component:Root})
function Root(){return <html lang="en"><head><HeadContent/></head><body><header className="topbar"><Link to="/" className="brand"><span className="signal"><i/><i/><i/></span><b>uc8</b>Live</Link><AuthNav/></header><Outlet/><footer className="footer"><span>© 2026 uc8Live</span><span><Radio size={14}/> Powered by Mux Video</span></footer><Scripts/></body></html>}
