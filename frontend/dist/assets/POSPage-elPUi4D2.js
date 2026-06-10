import{d as _,e as Se,a as Ce,u as ke,x as Ie,r,j as e,m as we,y as Ne,F as se,t as ze,L as Pe,B as Ae,z as C,i as ne,M as Te}from"./index-Bb-SR8Vu.js";import{u as k}from"./useQuery-CzEi9Pjc.js";import{u as oe}from"./useMutation-CnkaqUV9.js";import{p as I}from"./pos.api-BJk9oFY_.js";import{s as qe}from"./sales.api-BEPyXhfQ.js";import{c as Oe}from"./customers.api-D3f6JlZY.js";import{q}from"./queryKeys-DMWeh9yq.js";import{B as Q}from"./Button-B6SF2fhi.js";import{I as le}from"./Input-CjrchNQc.js";import{M as ae}from"./Modal-HibJODL5.js";import{C as Me}from"./CustomerFormDrawer-gJQHlHgh.js";import{C as Re}from"./calculator-DAf8iHEH.js";import{U as re}from"./user-B6KdIDIy.js";import{P as ie}from"./plus-CbVC-2l7.js";import{S as Fe}from"./search-DmtbI_PJ.js";import{T as Ee}from"./trash-2-EatK6mNE.js";import{M as De}from"./minus-CPnJrY_y.js";import{C as Le}from"./circle-x-Bw0IeRWJ.js";import"./requestUtils-gaJB49jo.js";import"./x-94CXtiWQ.js";import"./Drawer-DCxk_CnD.js";/**
 * @license lucide-react v0.396.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const de=_("CirclePause",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"10",x2:"10",y1:"15",y2:"9",key:"c1nkhi"}],["line",{x1:"14",x2:"14",y1:"15",y2:"9",key:"h65svq"}]]);/**
 * @license lucide-react v0.396.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ue=_("Maximize",[["path",{d:"M8 3H5a2 2 0 0 0-2 2v3",key:"1dcmit"}],["path",{d:"M21 8V5a2 2 0 0 0-2-2h-3",key:"1e4gt3"}],["path",{d:"M3 16v3a2 2 0 0 0 2 2h3",key:"wsl5sc"}],["path",{d:"M16 21h3a2 2 0 0 0 2-2v-3",key:"18trek"}]]);/**
 * @license lucide-react v0.396.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const We=_("Tags",[["path",{d:"m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19",key:"1cbfv1"}],["path",{d:"M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z",key:"135mg7"}],["circle",{cx:"6.5",cy:"9.5",r:".5",fill:"currentColor",key:"5pm5xn"}]]);function Ke({open:f,availableRegisters:b,onOpenSession:u,isPending:j}){const[h,w]=r.useState(""),[v,o]=r.useState(0);return f?e.jsx("div",{style:{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.8)",zIndex:9999,display:"flex",alignItems:"center",justifyItems:"center",justifyContent:"center"},children:e.jsxs("div",{style:{background:"#fff",padding:"32px",borderRadius:"12px",width:"90%",maxWidth:"420px",boxShadow:"0 20px 40px rgba(0,0,0,0.4)"},children:[e.jsxs("h2",{style:{margin:"0 0 16px",display:"flex",alignItems:"center",gap:"12px",fontSize:"24px",fontWeight:800,color:"#1f2937"},children:[e.jsx(Te,{size:28,color:"#3b82f6"})," Apertura de Caja"]}),e.jsx("p",{style:{color:"#6b7280",marginBottom:"24px",fontSize:"15px"},children:"Para comenzar a operar, debés abrir una caja registradora asignando el saldo inicial de efectivo."}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"20px"},children:[e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"8px"},children:[e.jsx("label",{style:{fontSize:"14px",fontWeight:700,color:"#374151"},children:"Seleccionar Caja"}),e.jsxs("select",{value:h,onChange:i=>w(i.target.value),style:{padding:"12px",borderRadius:"8px",border:"1px solid #d1d5db",background:"#f9fafb",color:"#111827",fontSize:"15px",outline:"none"},children:[e.jsx("option",{value:"",children:"-- Cajas Disponibles --"}),Array.isArray(b)&&b.map(i=>e.jsx("option",{value:i.id,children:i.name},i.id))]})]}),e.jsx(le,{label:"Fondo de Caja (Efectivo Inicial)",type:"number",min:"0",value:v,onChange:i=>o(Number(i.target.value)),style:{fontSize:"16px",padding:"12px"}}),e.jsx(Q,{variant:"primary",style:{marginTop:"8px",height:"52px",fontSize:"16px",fontWeight:800,borderRadius:"8px",background:"#3b82f6"},disabled:!h||j,loading:j,onClick:()=>u==null?void 0:u(h,v),children:"Abrir Turno"})]})]})}):null}function Ve(){const[f,b]=r.useState(new Date);return r.useEffect(()=>{const u=setInterval(()=>b(new Date),1e3);return()=>clearInterval(u)},[]),e.jsx("span",{children:f.toLocaleTimeString()})}function pt(){var ee;const f=Se(),b=Ce(),{user:u}=ke(),j=Ie(t=>t.enqueue),[h,w]=r.useState(""),v=r.useRef(null),[o,i]=r.useState([]),[O,M]=r.useState(0),[R,N]=r.useState(""),[ce,B]=r.useState(!1),[pe,F]=r.useState(!1),[E,xe]=r.useState("CASH"),[D,L]=r.useState(0),[H,ue]=r.useState(!1),[m,U]=r.useState([]),[he,W]=r.useState(!1);r.useEffect(()=>{const t=localStorage.getItem("vestix_suspended_sales");t&&U(JSON.parse(t))},[]);const{data:c,isLoading:K}=k({queryKey:q.pos.session(),queryFn:()=>I.getMyRegister()}),$=(c==null?void 0:c.branchId)||(u==null?void 0:u.branchId)||"",{data:ge}=k({queryKey:q.pos.registers($),queryFn:()=>I.getAvailableRegisters($),enabled:!K&&!c}),J=oe({mutationFn:t=>I.openSession({cashRegisterId:t.id,openingAmount:t.amt}),onSuccess:()=>{C.success("Caja abierta correctamente"),f.invalidateQueries({queryKey:q.pos.session()})},onError:t=>C.error(t.message||"Error al abrir caja")}),{data:fe}=k({queryKey:["pos","gridProducts"],queryFn:()=>I.searchProduct("")}),{data:S}=k({queryKey:["pos","search",h],queryFn:()=>I.searchProduct(h),enabled:h.length>=2}),{data:y}=k({queryKey:q.customers.all(),queryFn:()=>Oe.getCustomers({pageSize:1e3})}),me=o.reduce((t,s)=>t+s.qty,0),z=o.reduce((t,s)=>t+s.variant.basePrice*s.qty,0),G=o.reduce((t,s)=>t+s.variant.basePrice*s.qty*(s.discountPct/100),0),X=z-G,Y=X*(O/100),x=X-Y,g=t=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS"}).format(t),Z=t=>{var s;i(n=>n.find(l=>l.variant.id===t.id)?n.map(l=>l.variant.id===t.id?{...l,qty:l.qty+1}:l):[...n,{variant:t,qty:1,discountPct:0}]),w(""),(s=v.current)==null||s.focus()},V=(t,s)=>{s<1||i(n=>n.map(d=>d.variant.id===t?{...d,qty:s}:d))},be=t=>{i(s=>s.filter(n=>n.variant.id!==t))},ye=()=>{if(o.length===0)return;const t={id:crypto.randomUUID(),date:new Date().toISOString(),cart:o,customerId:R,discount:O,total:x},s=[...m,t];U(s),localStorage.setItem("vestix_suspended_sales",JSON.stringify(s)),C.success("Venta suspendida (Hold)"),i([]),N("")},je=t=>{const s=m.find(d=>d.id===t);if(!s)return;i(s.cart),N(s.customerId),M(s.discount);const n=m.filter(d=>d.id!==t);U(n),localStorage.setItem("vestix_suspended_sales",JSON.stringify(n)),W(!1)},P=oe({mutationFn:async(t="CONFIRMED")=>{var p,te;if(!c)throw new Error("No hay sesión de caja activa");const s=crypto.randomUUID();let n="main";try{const a=await f.fetchQuery({queryKey:["warehouses",c.branchId],queryFn:()=>ne("/inventory/warehouses",{params:{branchId:c.branchId}}),staleTime:6e5});n=((p=a==null?void 0:a[0])==null?void 0:p.id)||"main"}catch{n="main"}let d;try{const a=await f.fetchQuery({queryKey:["accounts",c.branchId],queryFn:()=>ne("/finance/accounts",{params:{branchId:c.branchId}}),staleTime:6e5});d=(te=a==null?void 0:a.find(T=>T.isActive))==null?void 0:te.id}catch{d=void 0}const l={id:s,branchId:c.branchId,warehouseId:n,customerId:R||void 0,source:"POS",paymentMethod:E==="MULTIPLE"?"CASH":E,paymentAccountId:d,status:t==="QUOTATION"?"QUOTE":"COMPLETED",posGrandTotal:x,cartDiscountTotal:x<z?z-x:0,createdAtIso:new Date().toISOString(),lines:o.map(a=>{var T;return{variantId:a.variant.id,categoryId:((T=a.variant.product)==null?void 0:T.categoryId)||"default",quantity:a.qty,unitPriceOverride:a.variant.basePrice,discountPct:a.discountPct}}),issueInvoice:H};if(!navigator.onLine)return j({module:"POS",action:"createSale",description:"Venta POS offline",endpoint:"/sales/checkout",method:"POST",maxRetries:5,payload:l}),{offline:!0};try{return{offline:!1,res:await qe.createSale(l)}}catch(a){if(!a.response||a.code==="ERR_NETWORK")return j({module:"POS",action:"createSale",description:"Venta POS offline",endpoint:"/sales/checkout",method:"POST",maxRetries:5,payload:l}),{offline:!0};throw a}},onSuccess:(t,s)=>{C.success(t!=null&&t.offline?"Registrado offline":s==="QUOTATION"?"Presupuesto Creado":"Venta Pagada!"),i([]),M(0),N(""),F(!1),L(0)},onError:t=>C.error(t.message||"Error al cobrar")}),A=t=>{o.length!==0&&(xe(t),L(x),F(!0))},ve=()=>{document.fullscreenElement?document.exitFullscreen&&document.exitFullscreen():document.documentElement.requestFullscreen().catch(t=>console.log(t))};return K?e.jsx("div",{style:{padding:"40px",textAlign:"center",fontWeight:600},children:"Iniciando terminal..."}):e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        .pos-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          position: fixed;
          top: 0; left: 0;
          background: #f4f6f9;
          z-index: 1000;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }
        .pos-navbar {
          background: #3c8dbc;
          color: #fff;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 15px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .pos-nav-logo {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.5px;
        }
        .pos-nav-icons {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .pos-icon-btn {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 4px;
        }
        .pos-icon-btn:hover { background: rgba(0,0,0,0.1); }
        .pos-main {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        .pos-left {
          flex: 6.5;
          display: flex;
          flex-direction: column;
          background: #fff;
          border-right: 1px solid #d2d6de;
        }
        .pos-right {
          flex: 3.5;
          display: flex;
          flex-direction: column;
          background: #ecf0f5;
        }
        .pos-cart-top {
          padding: 10px;
          background: #fff;
          border-bottom: 1px solid #d2d6de;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pos-search-wrap {
          display: flex;
          gap: 10px;
        }
        .pos-search-input {
          flex: 1;
          padding: 12px 12px 12px 40px;
          border: 2px solid #3c8dbc;
          border-radius: 4px;
          font-size: 16px;
          outline: none;
        }
        .pos-table-container {
          flex: 1;
          overflow-y: auto;
          background: #fff;
        }
        .pos-table {
          width: 100%;
          border-collapse: collapse;
        }
        .pos-table th {
          background: #f4f4f4;
          padding: 10px;
          text-align: left;
          font-size: 13px;
          color: #333;
          border-bottom: 2px solid #ddd;
          position: sticky;
          top: 0;
        }
        .pos-table td {
          padding: 8px 10px;
          border-bottom: 1px solid #f4f4f4;
          font-size: 14px;
          vertical-align: middle;
        }
        .pos-qty-input {
          width: 50px;
          text-align: center;
          padding: 4px;
          border: 1px solid #ccc;
          border-radius: 3px;
        }
        .pos-summary {
          background: #fff;
          border-top: 1px solid #d2d6de;
          padding: 10px 15px;
        }
        .pos-summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          margin-bottom: 5px;
        }
        .pos-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #e1f5fe;
          padding: 10px 15px;
          font-size: 24px;
          font-weight: 700;
          color: #01579b;
        }
        .pos-action-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 5px;
          padding: 10px;
          background: #fff;
        }
        .pos-btn {
          padding: 15px 5px;
          color: #fff;
          border: none;
          border-radius: 3px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          transition: opacity 0.2s;
        }
        .pos-btn:hover { opacity: 0.9; }
        .pos-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .bg-draft { background: #f39c12; }
        .bg-quotation { background: #00c0ef; }
        .bg-suspend { background: #dd4b39; }
        .bg-credit { background: #605ca8; }
        .bg-card { background: #39cccc; }
        .bg-multiple { background: #001f3f; }
        .bg-cash { background: #00a65a; grid-column: span 2; font-size: 16px; }
        
        .pos-products-header {
          padding: 10px;
          display: flex;
          gap: 10px;
          background: #ecf0f5;
        }
        .pos-products-grid {
          flex: 1;
          overflow-y: auto;
          padding: 10px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 10px;
          align-content: start;
        }
        .pos-product-card {
          background: #fff;
          border: 1px solid #d2d6de;
          border-radius: 4px;
          cursor: pointer;
          overflow: hidden;
          text-align: center;
          box-shadow: 0 1px 1px rgba(0,0,0,0.1);
        }
        .pos-product-card:hover { border-color: #3c8dbc; }
        .pos-product-img {
          height: 80px;
          background: #f4f4f4;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ccc;
        }
        .pos-product-info {
          padding: 8px 5px;
        }
        .pos-product-name {
          font-size: 12px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
          line-height: 1.2;
          height: 28px;
          overflow: hidden;
        }
        .pos-product-price {
          font-size: 13px;
          font-weight: 700;
          color: #00a65a;
        }
      `}),e.jsxs("div",{className:"pos-layout",children:[e.jsx(Ke,{open:!c&&!K,availableRegisters:ge||[],onOpenSession:(t,s)=>J.mutate({id:t,amt:s}),isPending:J.isPending}),e.jsxs("div",{className:"pos-navbar",children:[e.jsxs("div",{className:"pos-nav-logo",children:[e.jsx("span",{style:{fontWeight:900},children:"Vestix"})," ",e.jsx("span",{style:{fontWeight:300},children:"POS"})]}),e.jsxs("div",{className:"pos-nav-icons",children:[e.jsxs("div",{className:"pos-icon-btn",children:[e.jsx(we,{size:16})," ",e.jsx(Ve,{})]}),e.jsxs("button",{className:"pos-icon-btn",onClick:()=>W(!0),title:"Ventas Suspendidas",children:[e.jsx(de,{size:18})," ",m.length>0&&e.jsx("span",{style:{background:"#f39c12",padding:"2px 6px",borderRadius:"10px",fontSize:"11px",fontWeight:"bold"},children:m.length})]}),e.jsx("button",{className:"pos-icon-btn",onClick:ve,title:"Pantalla Completa",children:e.jsx(Ue,{size:18})}),e.jsx("button",{className:"pos-icon-btn",onClick:()=>window.open("/calculator","_blank","width=300,height=400"),title:"Calculadora",children:e.jsx(Re,{size:18})}),e.jsxs("button",{className:"pos-icon-btn",onClick:()=>b("/"),title:"Volver al Dashboard",children:[e.jsx(Ne,{size:18})," Volver"]})]})]}),e.jsxs("div",{className:"pos-main",children:[e.jsxs("div",{className:"pos-left",children:[e.jsxs("div",{className:"pos-cart-top",children:[e.jsxs("div",{style:{display:"flex",gap:"10px"},children:[e.jsxs("div",{style:{flex:1,position:"relative"},children:[e.jsx(re,{size:16,style:{position:"absolute",left:"10px",top:"10px",color:"#999"}}),e.jsxs("select",{value:R,onChange:t=>N(t.target.value),style:{width:"100%",padding:"8px 10px 8px 34px",borderRadius:"4px",border:"1px solid #ccc",fontSize:"14px",outline:"none"},children:[e.jsx("option",{value:"",children:"Cliente Ocasional / Consumidor Final"}),y==null?void 0:y.data.map(t=>e.jsx("option",{value:t.id,children:t.fullName},t.id))]})]}),e.jsx("button",{onClick:()=>B(!0),style:{padding:"0 15px",background:"#3c8dbc",color:"#fff",border:"none",borderRadius:"4px",cursor:"pointer"},children:e.jsx(ie,{size:18})})]}),e.jsxs("div",{style:{position:"relative"},children:[e.jsx(Fe,{size:20,style:{position:"absolute",left:"12px",top:"13px",color:"#3c8dbc"}}),e.jsx("input",{ref:v,type:"text",className:"pos-search-input",placeholder:"Ingrese el nombre del producto / SKU / Escanear código de barras",value:h,onChange:t=>w(t.target.value),onKeyDown:t=>{t.key==="Enter"&&(S==null?void 0:S.length)===1&&Z(S[0])},autoFocus:!0})]})]}),e.jsx("div",{className:"pos-table-container",children:e.jsxs("table",{className:"pos-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:"40%"},children:"Producto"}),e.jsx("th",{style:{width:"15%",textAlign:"center"},children:"Cant."}),e.jsx("th",{style:{width:"15%",textAlign:"right"},children:"Precio"}),e.jsx("th",{style:{width:"10%",textAlign:"right"},children:"Desc%"}),e.jsx("th",{style:{width:"15%",textAlign:"right"},children:"Subtotal"}),e.jsx("th",{style:{width:"5%",textAlign:"center"},children:e.jsx(Ee,{size:16})})]})}),e.jsx("tbody",{children:o.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:6,style:{textAlign:"center",padding:"40px",color:"#999"},children:"No hay productos agregados"})}):o.map((t,s)=>e.jsxs("tr",{children:[e.jsxs("td",{style:{fontWeight:600,color:"#3c8dbc"},children:[t.variant.productName||"Producto"," ",t.variant.size?`(${t.variant.size})`:""]}),e.jsx("td",{style:{textAlign:"center"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center"},children:[e.jsx("button",{onClick:()=>V(t.variant.id,t.qty-1),style:{padding:"2px",border:"1px solid #ccc",background:"#f4f4f4",cursor:"pointer"},children:e.jsx(De,{size:12})}),e.jsx("input",{type:"number",className:"pos-qty-input",value:t.qty,onChange:n=>V(t.variant.id,Number(n.target.value))}),e.jsx("button",{onClick:()=>V(t.variant.id,t.qty+1),style:{padding:"2px",border:"1px solid #ccc",background:"#f4f4f4",cursor:"pointer"},children:e.jsx(ie,{size:12})})]})}),e.jsx("td",{style:{textAlign:"right"},children:e.jsx("input",{type:"number",style:{width:"70px",textAlign:"right",padding:"2px",border:"1px solid #ccc"},value:t.variant.basePrice,onChange:n=>{const d=Number(n.target.value);i(l=>l.map(p=>p.variant.id===t.variant.id?{...p,variant:{...p.variant,basePrice:d}}:p))}})}),e.jsx("td",{style:{textAlign:"right"},children:e.jsx("input",{type:"number",style:{width:"50px",textAlign:"right",padding:"2px",border:"1px solid #ccc"},value:t.discountPct,onChange:n=>{const d=Number(n.target.value);i(l=>l.map(p=>p.variant.id===t.variant.id?{...p,discountPct:d}:p))}})}),e.jsx("td",{style:{textAlign:"right",fontWeight:"bold"},children:g(t.variant.basePrice*t.qty*(1-t.discountPct/100))}),e.jsx("td",{style:{textAlign:"center"},children:e.jsx("button",{onClick:()=>be(t.variant.id),style:{color:"#dd4b39",background:"none",border:"none",cursor:"pointer"},children:e.jsx(Le,{size:18})})})]},`${t.variant.id}-${s}`))})]})}),e.jsxs("div",{className:"pos-summary",children:[e.jsxs("div",{className:"pos-summary-row",children:[e.jsxs("span",{children:[e.jsx("b",{children:"Items:"})," ",me]}),e.jsxs("span",{children:[e.jsx("b",{children:"Subtotal:"})," ",g(z)]})]}),e.jsxs("div",{className:"pos-summary-row",style:{alignItems:"center"},children:[e.jsxs("span",{style:{display:"flex",alignItems:"center",gap:"5px"},children:[e.jsx("b",{children:"Descuento %:"}),e.jsx("input",{type:"number",style:{width:"60px",padding:"2px",border:"1px solid #ccc"},value:O,onChange:t=>M(Number(t.target.value))})]}),e.jsxs("span",{style:{color:"#dd4b39"},children:[e.jsx("b",{children:"(-)"})," ",g(Y+G)]})]})]}),e.jsxs("div",{className:"pos-total-row",children:[e.jsx("span",{children:"Total a Pagar"}),e.jsx("span",{children:g(x)})]}),e.jsxs("div",{className:"pos-action-buttons",children:[e.jsxs("button",{className:"pos-btn bg-draft",disabled:o.length===0,onClick:()=>P.mutate("QUOTATION"),children:[e.jsx(se,{size:20})," Borrador"]}),e.jsxs("button",{className:"pos-btn bg-quotation",disabled:o.length===0,onClick:()=>P.mutate("QUOTATION"),children:[e.jsx(se,{size:20})," Cotización"]}),e.jsxs("button",{className:"pos-btn bg-suspend",disabled:o.length===0,onClick:ye,children:[e.jsx(de,{size:20})," Suspender"]}),e.jsxs("button",{className:"pos-btn bg-credit",disabled:o.length===0,onClick:()=>A("CUSTOMER_CREDIT"),children:[e.jsx(re,{size:20})," Crédito"]}),e.jsxs("button",{className:"pos-btn bg-card",disabled:o.length===0,onClick:()=>A("CREDIT_CARD"),children:[e.jsx(ze,{size:20})," Tarjeta"]}),e.jsxs("button",{className:"pos-btn bg-multiple",disabled:o.length===0,onClick:()=>A("MULTIPLE"),children:[e.jsx(Pe,{size:20})," Múltiple"]}),e.jsxs("button",{className:"pos-btn bg-cash",disabled:o.length===0,onClick:()=>A("CASH"),children:[e.jsx(Ae,{size:24})," Efectivo"]})]})]}),e.jsxs("div",{className:"pos-right",children:[e.jsxs("div",{className:"pos-products-header",children:[e.jsx("select",{style:{flex:1,padding:"8px",border:"1px solid #ccc",borderRadius:"3px"},children:e.jsx("option",{children:"Todas las Categorías"})}),e.jsx("select",{style:{flex:1,padding:"8px",border:"1px solid #ccc",borderRadius:"3px"},children:e.jsx("option",{children:"Todas las Marcas"})})]}),e.jsx("div",{className:"pos-products-grid",children:(ee=h.length>=2?S:fe)==null?void 0:ee.map(t=>e.jsxs("div",{className:"pos-product-card",onClick:()=>Z(t),children:[e.jsx("div",{className:"pos-product-img",children:e.jsx(We,{size:32})}),e.jsxs("div",{className:"pos-product-info",children:[e.jsxs("div",{className:"pos-product-name",children:[t.productName||"Producto"," ",t.size?`(${t.size})`:""]}),e.jsx("div",{className:"pos-product-price",children:g(t.basePrice)})]})]},t.id))})]})]}),e.jsx(ae,{open:pe,onClose:()=>F(!1),title:"Confirmar Pago",children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"20px"},children:[e.jsxs("div",{style:{background:"#00a65a",color:"#fff",padding:"20px",textAlign:"center",borderRadius:"4px"},children:[e.jsx("div",{style:{fontSize:"14px",textTransform:"uppercase"},children:"Monto a Pagar"}),e.jsx("div",{style:{fontSize:"42px",fontWeight:700},children:g(x)})]}),E==="CASH"&&e.jsxs("div",{children:[e.jsx("label",{style:{fontWeight:"bold"},children:"Monto Recibido"}),e.jsx(le,{type:"number",min:x,value:D,onChange:t=>L(Number(t.target.value)),style:{fontSize:"24px",padding:"10px"}}),D>x&&e.jsxs("div",{style:{marginTop:"15px",color:"#dd4b39",fontSize:"20px",fontWeight:"bold"},children:["Vuelto: ",g(D-x)]})]}),e.jsx("div",{children:e.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer"},children:[e.jsx("input",{type:"checkbox",checked:H,onChange:t=>ue(t.target.checked)}),"Imprimir Ticket Fiscal AFIP"]})}),e.jsx(Q,{variant:"primary",style:{height:"50px",fontSize:"18px",background:"#00a65a",border:"none"},onClick:()=>P.mutate("CONFIRMED"),loading:P.isPending,children:"Completar Venta"})]})}),e.jsx(ae,{open:he,onClose:()=>W(!1),title:"Ventas Suspendidas",children:m.length===0?e.jsx("p",{children:"No hay ventas en suspenso."}):e.jsxs("table",{className:"pos-table",style:{border:"1px solid #ddd"},children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Fecha"}),e.jsx("th",{children:"Cliente"}),e.jsx("th",{children:"Total"}),e.jsx("th",{children:"Acción"})]})}),e.jsx("tbody",{children:m.map(t=>{var s;return e.jsxs("tr",{children:[e.jsx("td",{children:new Date(t.date).toLocaleString()}),e.jsx("td",{children:((s=y==null?void 0:y.data.find(n=>n.id===t.customerId))==null?void 0:s.fullName)||"Consumidor Final"}),e.jsx("td",{style:{fontWeight:"bold"},children:g(t.total)}),e.jsx("td",{children:e.jsx(Q,{variant:"primary",style:{padding:"5px 10px",fontSize:"12px"},onClick:()=>je(t.id),children:"Retomar"})})]},t.id)})})]})}),e.jsx(Me,{open:ce,onClose:()=>B(!1)})]})]})}export{pt as default};
