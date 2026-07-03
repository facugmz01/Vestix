import{az as I,a as L,r as a,j as e,aA as x,$ as A,w as T,aB as E}from"./index-CDyEVdMx.js";import{u as W}from"./useQuery-DvRorv1r.js";import{u as $}from"./cart.store-C7ZbdPOz.js";import{u as R}from"./storefrontAuth.store-cM4bm0tt.js";import{s as N}from"./storefront.api-DEI63fZ2.js";import{U as m}from"./user-D2cgmlm0.js";import{C as M}from"./chevron-down-D-7DCvjS.js";import{L as B}from"./log-in-Cho8inTC.js";import{L as b}from"./loader-circle-BpoaMcYL.js";const y=i=>{const n=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(i);return n?`${parseInt(n[1],16)}, ${parseInt(n[2],16)}, ${parseInt(n[3],16)}`:"59, 130, 246"};function X(){const i=$(r=>r.totalItems()),n=I(),u=L(),{data:t,isLoading:v}=W({queryKey:["storefrontSettings",n],queryFn:()=>N.getSettings()}),{customer:o,isAuthenticated:j,loadCurrentCustomer:g,logout:S}=R(),[s,k]=a.useState(window.innerWidth<768),[l,d]=a.useState(!1),f=a.useRef(null);a.useEffect(()=>{g()},[g]),a.useEffect(()=>{const r=()=>k(window.innerWidth<768);return window.addEventListener("resize",r),()=>window.removeEventListener("resize",r)},[]),a.useEffect(()=>{const r=c=>{f.current&&!f.current.contains(c.target)&&d(!1)};return l&&document.addEventListener("mousedown",r),()=>document.removeEventListener("mousedown",r)},[l]);const F=async()=>{d(!1),await S(),u(`${n}/`)},p=(t==null?void 0:t.primaryColor)||"#3b82f6",w=(t==null?void 0:t.fontFamily)||'"Inter", sans-serif',h=(t==null?void 0:t.storeName)||"ERPStore",z=(t==null?void 0:t.showStoreName)!==!1,C=o!=null&&o.fullName?o.fullName.length>14?o.fullName.slice(0,14)+"…":o.fullName:(o==null?void 0:o.phone)||"Mi Cuenta";return e.jsxs("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,width:"100vw",height:"100dvh",overflowY:"auto",overflowX:"hidden",display:"flex",flexDirection:"column",background:"#FAFAFC",fontFamily:w,zIndex:99999},children:[e.jsx("style",{children:`
        /* The following overrides ensure Storefront is ALWAYS in Light Mode premium */
        :root, html.dark {
          --bg-base: #FAFAFC;
          --bg-surface: #FFFFFF;
          --bg-surface-hover: #F8FAFC;
          --bg-elevated: #FFFFFF;
          --bg-overlay: rgba(255, 255, 255, 0.8);
          
          --text-primary: #0F172A;
          --text-secondary: #475569;
          --text-muted: #94A3B8;
          --text-inverted: #FFFFFF;
          
          --border: #E2E8F0;
          --border-strong: #CBD5E1;
          
          /* Overriding global accent variables for Storefront */
          --accent: ${p};
          --accent-rgb: ${y(p)};
          --accent-subtle: rgba(var(--accent-rgb), 0.1);
          --accent-hover: rgba(var(--accent-rgb), 0.9);
          
          /* Keeping sf- specific aliases just in case */
          --sf-primary: ${p};
          --sf-primary-rgb: ${y(p)};
          --sf-primary-subtle: rgba(var(--sf-primary-rgb), 0.1);
          --sf-primary-hover: rgba(var(--sf-primary-rgb), 0.9);
        }
        
        .sf-btn {
          background: var(--sf-primary);
          color: white;
          transition: all 0.2s;
        }
        .sf-btn:hover {
          background: var(--sf-primary-hover);
        }
        .sf-text-primary {
          color: var(--sf-primary);
        }
        .sf-bg-subtle {
          background: var(--sf-primary-subtle);
        }
        .sf-border-primary {
          border-color: var(--sf-primary);
        }
      `}),e.jsx("header",{style:{background:"rgba(255, 255, 255, 0.85)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(0,0,0,0.05)",position:"sticky",top:0,zIndex:100,boxShadow:"0 4px 30px rgba(0, 0, 0, 0.03)"},children:e.jsxs("div",{style:{maxWidth:"1200px",margin:"0 auto",padding:s?"12px 16px":"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs(x,{to:`${n}/`,style:{textDecoration:"none",display:"flex",alignItems:"center",gap:"8px",color:"#0f172a"},children:[e.jsx("div",{style:{background:"var(--sf-primary)",color:"#fff",width:"32px",height:"32px",borderRadius:"8px",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:"18px"},children:h.charAt(0).toUpperCase()}),z&&e.jsx("span",{style:{fontSize:s?"18px":"20px",fontWeight:800,letterSpacing:"-0.5px"},children:h})]}),!s&&e.jsx("div",{style:{flex:1,maxWidth:"400px",margin:"0 24px"},children:e.jsxs("form",{onSubmit:r=>{r.preventDefault();const c=new FormData(r.currentTarget).get("q");c&&u(`${n}/?search=${encodeURIComponent(c.toString())}`)},style:{position:"relative",width:"100%"},children:[e.jsx("input",{name:"q",type:"text",placeholder:"Buscar productos...",style:{width:"100%",padding:"10px 16px 10px 36px",background:"#f1f5f9",border:"1px solid transparent",borderRadius:"8px",fontSize:"14px",color:"#0f172a",outline:"none",transition:"all 0.2s"},onFocus:r=>{r.currentTarget.style.background="#fff",r.currentTarget.style.border="1px solid #cbd5e1",r.currentTarget.style.boxShadow="0 0 0 2px rgba(59,130,246,0.1)"},onBlur:r=>{r.currentTarget.style.background="#f1f5f9",r.currentTarget.style.border="1px solid transparent",r.currentTarget.style.boxShadow="none"}}),e.jsxs("svg",{width:"16",height:"16",viewBox:"0 0 24 24",fill:"none",stroke:"#94a3b8",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",style:{position:"absolute",left:"12px",top:"12px",pointerEvents:"none"},children:[e.jsx("circle",{cx:"11",cy:"11",r:"8"}),e.jsx("line",{x1:"21",y1:"21",x2:"16.65",y2:"16.65"})]})]})}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:s?"8px":"12px"},children:[j&&o?e.jsxs("div",{ref:f,style:{position:"relative"},children:[e.jsxs("button",{onClick:()=>d(r=>!r),style:{display:"flex",alignItems:"center",gap:"6px",background:"#f1f5f9",border:"none",borderRadius:"10px",padding:s?"7px 10px":"7px 14px",cursor:"pointer",color:"#0f172a",fontSize:"13px",fontWeight:600,transition:"background 0.2s"},"aria-label":"Menú de usuario",children:[e.jsx(m,{size:16}),!s&&e.jsx("span",{children:C}),e.jsx(M,{size:14,style:{opacity:.5,transform:l?"rotate(180deg)":"none",transition:"transform 0.2s"}})]}),l&&e.jsxs("div",{style:{position:"absolute",top:"calc(100% + 8px)",right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:"12px",boxShadow:"0 8px 32px rgba(0,0,0,0.12)",minWidth:"180px",overflow:"hidden",zIndex:200},children:[e.jsxs("div",{style:{padding:"12px 16px",borderBottom:"1px solid #f1f5f9"},children:[e.jsx("div",{style:{fontSize:"12px",color:"#94a3b8",marginBottom:"2px"},children:"Hola,"}),e.jsx("div",{style:{fontSize:"14px",fontWeight:700,color:"#0f172a"},children:o.fullName}),o.phone&&e.jsxs("div",{style:{fontSize:"12px",color:"#64748b"},children:["+",o.phone]})]}),e.jsxs(x,{to:`${n}/my-orders`,onClick:()=>d(!1),style:{display:"flex",alignItems:"center",gap:"10px",padding:"12px 16px",textDecoration:"none",color:"#0f172a",fontSize:"14px",transition:"background 0.15s"},onMouseEnter:r=>r.currentTarget.style.background="#f8fafc",onMouseLeave:r=>r.currentTarget.style.background="transparent",children:[e.jsx(m,{size:15})," Mis pedidos"]}),e.jsxs("button",{onClick:F,style:{width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"12px 16px",border:"none",background:"transparent",color:"#ef4444",fontSize:"14px",cursor:"pointer",transition:"background 0.15s",textAlign:"left"},onMouseEnter:r=>r.currentTarget.style.background="#fef2f2",onMouseLeave:r=>r.currentTarget.style.background="transparent",children:[e.jsx(A,{size:15})," Cerrar sesión"]})]})]}):e.jsxs(x,{to:`${n}/login`,style:{display:"flex",alignItems:"center",gap:"6px",background:"#f1f5f9",borderRadius:"10px",padding:s?"7px 10px":"7px 14px",textDecoration:"none",color:"#0f172a",fontSize:"13px",fontWeight:600,transition:"background 0.2s"},title:"Iniciar sesión",children:[e.jsx(B,{size:16}),!s&&e.jsx("span",{children:"Ingresar"})]}),e.jsxs(x,{to:`${n}/cart`,style:{textDecoration:"none",position:"relative",cursor:"pointer",padding:"8px",background:"#f1f5f9",borderRadius:"50%",color:"#0f172a",display:"flex",alignItems:"center",justifyContent:"center"},title:"Carrito de Compras",children:[e.jsx(T,{size:20}),i>0&&e.jsx("span",{style:{position:"absolute",top:"-4px",right:"-4px",background:"#ef4444",color:"#fff",fontSize:"10px",fontWeight:800,padding:"2px 6px",borderRadius:"10px",minWidth:"18px",textAlign:"center"},children:i>99?"99+":i})]})]})]})}),e.jsx("main",{style:{flex:1},children:v?e.jsx("div",{style:{display:"flex",justifyContent:"center",alignItems:"center",minHeight:"50vh"},children:e.jsx(b,{size:32,className:"spin",color:"var(--accent)"})}):e.jsx(a.Suspense,{fallback:e.jsx("div",{style:{padding:"40px",textAlign:"center"},children:e.jsx(b,{size:24,className:"spin"})}),children:e.jsx(E,{context:{settings:t}})})}),e.jsx("footer",{style:{background:"#0f172a",color:"#94a3b8",padding:s?"32px 16px":"48px 24px",textAlign:"center",marginTop:"auto"},children:e.jsxs("div",{style:{maxWidth:"1200px",margin:"0 auto"},children:[e.jsx("h2",{style:{color:"#fff",fontSize:"24px",fontWeight:800,marginBottom:"16px"},children:"ERPStore"}),e.jsx("p",{style:{maxWidth:"400px",margin:"0 auto 24px",lineHeight:1.6,fontSize:"14px"},children:"Tecnología al servicio del comercio. Compra segura y envío a todo el país."}),e.jsxs("div",{style:{borderTop:"1px solid #1e293b",paddingTop:"24px",fontSize:"13px"},children:["© ",new Date().getFullYear()," Todos los derechos reservados."]})]})})]})}export{X as default};
