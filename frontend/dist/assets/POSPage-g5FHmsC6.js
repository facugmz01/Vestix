import{d as X,e as he,r as n,z as x,j as e,a as Ne,u as Pe,x as ze,m as Ie,y as ie,F as le,t as Oe,L as qe,B as Ae,i as de}from"./index-CvkWnbe5.js";import{u as M}from"./useQuery-DWvj5lnH.js";import{u as Y}from"./useMutation-B26X9pKk.js";import{p as H}from"./pos.api-Cegb3bcl.js";import{s as Te}from"./sales.api-6Wi6vuma.js";import{c as Ee}from"./customers.api-CqEpBCLh.js";import{t as J}from"./treasury.api-BR0f02NJ.js";import{q as ce}from"./queryKeys-DMWeh9yq.js";import{B as U}from"./Button-TqB6b_gv.js";import{I as Me}from"./Input-Cda7NqdS.js";import{M as G}from"./Modal-DEfQOMRx.js";import{C as Fe}from"./CustomerFormDrawer-DjhA8hQt.js";import{C as Re}from"./calculator-zumVpSfu.js";import{U as pe}from"./user-Bk-EQ9Pj.js";import{P as ue}from"./plus-D-DeQ178.js";import{S as De}from"./search-tW466A3i.js";import{T as Le}from"./trash-2-M2v1Vgc_.js";import{M as We}from"./minus-C4-S97iQ.js";import{C as Ue}from"./circle-x-CbAXgTGM.js";import"./requestUtils-gaJB49jo.js";import"./x-BJd8spEh.js";import"./Drawer-doxoqJKE.js";/**
 * @license lucide-react v0.396.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xe=X("CirclePause",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"10",x2:"10",y1:"15",y2:"9",key:"c1nkhi"}],["line",{x1:"14",x2:"14",y1:"15",y2:"9",key:"h65svq"}]]);/**
 * @license lucide-react v0.396.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ke=X("Maximize",[["path",{d:"M8 3H5a2 2 0 0 0-2 2v3",key:"1dcmit"}],["path",{d:"M21 8V5a2 2 0 0 0-2-2h-3",key:"1e4gt3"}],["path",{d:"M3 16v3a2 2 0 0 0 2 2h3",key:"wsl5sc"}],["path",{d:"M16 21h3a2 2 0 0 0 2-2v-3",key:"18trek"}]]);/**
 * @license lucide-react v0.396.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qe=X("Tags",[["path",{d:"m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19",key:"1cbfv1"}],["path",{d:"M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z",key:"135mg7"}],["circle",{cx:"6.5",cy:"9.5",r:".5",fill:"currentColor",key:"5pm5xn"}]]);function ge({open:h,onClose:b,mode:d,activeShift:I,cashRegisterId:f,registers:C}){const O=he(),[o,p]=n.useState(""),[k,w]=n.useState(""),[y,N]=n.useState(f||"");n.useEffect(()=>{h&&(p(""),w(""))},[h]);const F=Y({mutationFn:()=>J.openShift(y,parseFloat(o)||0),onSuccess:()=>{x.success("Turno abierto exitosamente"),O.invalidateQueries({queryKey:["shifts","active"]}),b()},onError:a=>x.error(a.message||"Error al abrir caja")}),q=Y({mutationFn:()=>J.closeShift(I.id,parseFloat(o)||0,k),onSuccess:a=>{const A=a.data||a;if(A.difference!==0){const T=A.difference>0?"SOBRANTE":"FALTANTE";x(`Turno cerrado con ${T} de $${Math.abs(A.difference)}`,{icon:"⚠️"})}else x.success("Turno cerrado exitosamente (Arqueo Exacto)");O.invalidateQueries({queryKey:["shifts","active"]}),b()},onError:a=>x.error(a.message||"Error al cerrar caja")}),K=a=>{if(a.preventDefault(),o==="")return x.error("Ingresa un monto");if(d==="OPEN"){if(!y)return x.error("Selecciona una caja");F.mutate()}else{if(!I)return x.error("No hay turno activo");q.mutate()}},P=F.isPending||q.isPending;return e.jsx(G,{open:h,onClose:b,title:d==="OPEN"?"Apertura de Caja":"Cierre de Caja (Arqueo Ciego)",children:e.jsxs("form",{onSubmit:K,style:{display:"flex",flexDirection:"column",gap:"16px"},children:[d==="OPEN"&&e.jsxs("p",{style:{fontSize:"13px",color:"var(--text-secondary)"},children:["Para poder facturar en el POS necesitas abrir un turno. Ingresa el ",e.jsx("strong",{children:"Fondo de Caja"})," (dinero inicial para cambio)."]}),d==="CLOSE"&&e.jsx("p",{style:{fontSize:"13px",color:"var(--text-secondary)"},children:"Cuenta los billetes y monedas en la caja y declara el total. El sistema registrará cualquier diferencia automáticamente."}),d==="OPEN"&&C&&C.length>0&&e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("label",{style:{fontSize:"13px",fontWeight:600},children:"Seleccionar Caja"}),e.jsxs("select",{value:y,onChange:a=>N(a.target.value),style:{padding:"10px 12px",borderRadius:"6px",border:"1px solid var(--border)",fontSize:"14px",background:"var(--bg-base)"},children:[e.jsx("option",{value:"",children:"-- Cajas Disponibles --"}),C.map(a=>e.jsx("option",{value:a.id,children:a.name},a.id))]})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("label",{style:{fontSize:"13px",fontWeight:600},children:d==="OPEN"?"Saldo Inicial (Efectivo)":"Dinero Físico Contado"}),e.jsx("input",{type:"number",step:"0.01",value:o,onChange:a=>p(a.target.value),placeholder:"0.00",style:{padding:"10px 12px",borderRadius:"6px",border:"1px solid var(--border)",fontSize:"16px",fontWeight:600},autoFocus:!0})]}),d==="CLOSE"&&e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("label",{style:{fontSize:"13px",fontWeight:600},children:"Notas / Observaciones (Opcional)"}),e.jsx("input",{type:"text",value:k,onChange:a=>w(a.target.value),placeholder:"Ej: Faltan $10 por compra de agua",style:{padding:"10px 12px",borderRadius:"6px",border:"1px solid var(--border)"}})]}),e.jsxs("div",{style:{display:"flex",justifyContent:"flex-end",gap:"12px",marginTop:"8px"},children:[d==="CLOSE"&&e.jsx(U,{variant:"ghost",onClick:b,disabled:P,children:"Cancelar"}),e.jsx(U,{variant:"primary",type:"submit",loading:P,children:d==="OPEN"?"Abrir Turno":"Cerrar Turno"})]})]})})}function Ve(){const[h,b]=n.useState(new Date);return n.useEffect(()=>{const d=setInterval(()=>b(new Date),1e3);return()=>clearInterval(d)},[]),e.jsx("span",{children:h.toLocaleTimeString()})}function xt(){var oe;const h=he(),b=Ne(),{user:d}=Pe(),I=ze(t=>t.enqueue),[f,C]=n.useState(""),O=n.useRef(null),[o,p]=n.useState([]),[k,w]=n.useState(0),[y,N]=n.useState(""),[F,q]=n.useState(!1),[K,P]=n.useState(!1),[a,A]=n.useState("CASH"),[T,Q]=n.useState(0),[Z,be]=n.useState(!1),[v,V]=n.useState([]),[me,_]=n.useState(!1),[fe,ee]=n.useState(!1);n.useEffect(()=>{const t=localStorage.getItem("vestix_suspended_sales");t&&V(JSON.parse(t))},[]);const{data:j,isLoading:$}=M({queryKey:["shifts","active"],queryFn:()=>J.getActiveShift()}),S=(d==null?void 0:d.branchId)||"",{data:ye}=M({queryKey:ce.pos.registers(S),queryFn:()=>H.getAvailableRegisters(S),enabled:!$&&!j}),{data:ve}=M({queryKey:["pos","gridProducts"],queryFn:()=>H.searchProduct("")}),{data:E}=M({queryKey:["pos","search",f],queryFn:()=>H.searchProduct(f),enabled:f.length>=2}),{data:z}=M({queryKey:ce.customers.all(),queryFn:()=>Ee.getCustomers({pageSize:1e3})}),je=o.reduce((t,r)=>t+r.qty,0),R=o.reduce((t,r)=>t+r.variant.basePrice*r.qty,0),te=o.reduce((t,r)=>t+r.variant.basePrice*r.qty*(r.discountPct/100),0),re=R-te,ae=re*(k/100),g=re-ae,m=t=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS"}).format(t),se=t=>{var r;p(s=>s.find(c=>c.variant.id===t.id)?s.map(c=>c.variant.id===t.id?{...c,qty:c.qty+1}:c):[...s,{variant:t,qty:1,discountPct:0}]),C(""),(r=O.current)==null||r.focus()},B=(t,r)=>{r<1||p(s=>s.map(l=>l.variant.id===t?{...l,qty:r}:l))},Se=t=>{p(r=>r.filter(s=>s.variant.id!==t))},Ce=()=>{if(o.length===0)return;const t={id:crypto.randomUUID(),date:new Date().toISOString(),cart:o,customerId:y,discount:k,total:g},r=[...v,t];V(r),localStorage.setItem("vestix_suspended_sales",JSON.stringify(r)),x.success("Venta suspendida (Hold)"),p([]),N("")},ke=t=>{const r=v.find(l=>l.id===t);if(!r)return;p(r.cart),N(r.customerId),w(r.discount);const s=v.filter(l=>l.id!==t);V(s),localStorage.setItem("vestix_suspended_sales",JSON.stringify(s)),_(!1)},D=Y({mutationFn:async(t="CONFIRMED")=>{var u,ne;if(!j)throw new Error("No hay sesión de caja activa");const r=crypto.randomUUID();let s="main";try{const i=await h.fetchQuery({queryKey:["warehouses",S],queryFn:()=>de("/inventory/warehouses",{params:{branchId:S}}),staleTime:6e5});s=((u=i==null?void 0:i[0])==null?void 0:u.id)||"main"}catch{s="main"}let l;try{const i=await h.fetchQuery({queryKey:["accounts",S],queryFn:()=>de("/finance/accounts",{params:{branchId:S}}),staleTime:6e5});l=(ne=i==null?void 0:i.find(W=>W.isActive))==null?void 0:ne.id}catch{l=void 0}const c={id:r,branchId:S,warehouseId:s,customerId:y||void 0,source:"POS",paymentMethod:a==="MULTIPLE"?"CASH":a,paymentAccountId:l,cashShiftId:j==null?void 0:j.id,status:t==="QUOTATION"?"QUOTE":"COMPLETED",posGrandTotal:g,cartDiscountTotal:g<R?R-g:0,createdAtIso:new Date().toISOString(),lines:o.map(i=>{var W;return{variantId:i.variant.id,categoryId:((W=i.variant.product)==null?void 0:W.categoryId)||"default",quantity:i.qty,unitPriceOverride:i.variant.basePrice,discountPct:i.discountPct}}),issueInvoice:Z};if(!navigator.onLine)return I({module:"POS",action:"createSale",description:"Venta POS offline",endpoint:"/sales/checkout",method:"POST",maxRetries:5,payload:c}),{offline:!0};try{return{offline:!1,res:await Te.createSale(c)}}catch(i){if(!i.response||i.code==="ERR_NETWORK")return I({module:"POS",action:"createSale",description:"Venta POS offline",endpoint:"/sales/checkout",method:"POST",maxRetries:5,payload:c}),{offline:!0};throw i}},onSuccess:(t,r)=>{x.success(t!=null&&t.offline?"Registrado offline":r==="QUOTATION"?"Presupuesto Creado":"Venta Pagada!"),p([]),w(0),N(""),P(!1),Q(0)},onError:t=>x.error(t.message||"Error al cobrar")}),L=t=>{o.length!==0&&(A(t),Q(g),P(!0))},we=()=>{document.fullscreenElement?document.exitFullscreen&&document.exitFullscreen():document.documentElement.requestFullscreen().catch(t=>console.log(t))};return $?e.jsx("div",{style:{padding:"40px",textAlign:"center",fontWeight:600},children:"Cargando estado de caja..."}):e.jsxs(e.Fragment,{children:["      ",e.jsx("style",{children:`
        .pos-layout {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100vw;
          background: var(--bg-base);
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }
        .pos-navbar {
          background: rgba(19, 22, 30, 0.8);
          backdrop-filter: blur(12px);
          color: var(--text-primary);
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
          z-index: 10;
        }
        .pos-nav-logo {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          background: linear-gradient(to right, #fff, #9ca3af);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .pos-nav-logo span {
          font-weight: 300;
        }
        .pos-nav-icons {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .pos-icon-btn {
          background: transparent;
          border: 1px solid transparent;
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius);
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .pos-icon-btn:hover { 
          background: var(--bg-overlay); 
          color: var(--text-primary); 
          border-color: var(--border);
        }
        .pos-main {
          display: flex;
          flex: 1;
          overflow: hidden;
          padding: 16px;
          gap: 16px;
        }
        .pos-left {
          flex: 6.5;
          display: flex;
          flex-direction: column;
          background: rgba(26, 30, 42, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }
        .pos-right {
          flex: 3.5;
          display: flex;
          flex-direction: column;
          background: rgba(26, 30, 42, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-md);
        }
        .pos-cart-top {
          padding: 16px;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pos-search-input {
          flex: 1;
          padding: 12px 16px 12px 42px;
          border: 1px solid var(--border);
          background: rgba(0,0,0,0.2);
          color: var(--text-primary);
          border-radius: 99px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s;
        }
        .pos-search-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent-glow);
          background: rgba(0,0,0,0.3);
        }
        .pos-table-container {
          flex: 1;
          overflow-y: auto;
          background: transparent;
        }
        .pos-table {
          width: 100%;
          border-collapse: collapse;
        }
        .pos-table th {
          background: rgba(0,0,0,0.2);
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          backdrop-filter: blur(10px);
          z-index: 5;
        }
        .pos-table td {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          font-size: 14px;
          vertical-align: middle;
          color: var(--text-primary);
        }
        .pos-qty-input {
          width: 48px;
          text-align: center;
          padding: 6px;
          border: 1px solid var(--border);
          background: rgba(0,0,0,0.2);
          color: var(--text-primary);
          border-radius: var(--radius-sm);
          font-weight: 600;
          outline: none;
        }
        .pos-qty-input:focus {
          border-color: var(--accent);
        }
        .qty-btn {
          padding: 6px;
          border: 1px solid var(--border);
          background: var(--bg-overlay);
          color: var(--text-primary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          transition: all 0.1s;
        }
        .qty-btn:hover {
          background: var(--bg-elevated);
          border-color: var(--text-muted);
        }
        .qty-btn:active {
          transform: scale(0.95);
        }
        .pos-summary {
          background: rgba(0,0,0,0.2);
          border-top: 1px solid var(--border);
          padding: 16px;
        }
        .pos-summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          margin-bottom: 8px;
          color: var(--text-secondary);
        }
        .pos-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(to right, rgba(99,102,241,0.1), rgba(99,102,241,0.02));
          border: 1px solid var(--border-focus);
          padding: 16px;
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          border-radius: var(--radius);
          margin-top: 8px;
          box-shadow: 0 4px 20px var(--accent-glow);
        }
        .pos-action-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          padding: 16px;
          background: rgba(255,255,255,0.02);
          border-top: 1px solid var(--border);
        }
        .pos-btn {
          padding: 16px 8px;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: var(--radius);
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-sm);
        }
        .pos-btn:hover { 
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
          filter: brightness(1.1);
        }
        .pos-btn:active {
          transform: translateY(0);
        }
        .pos-btn:disabled { 
          opacity: 0.4; 
          cursor: not-allowed; 
          transform: none !important;
          box-shadow: none !important;
          filter: grayscale(1);
        }
        
        .bg-draft { background: linear-gradient(135deg, var(--yellow), #ca8a04); }
        .bg-quotation { background: linear-gradient(135deg, var(--blue), #2563eb); }
        .bg-suspend { background: linear-gradient(135deg, var(--red), #dc2626); }
        .bg-credit { background: linear-gradient(135deg, var(--purple), #9333ea); }
        .bg-card { background: linear-gradient(135deg, #0ea5e9, #0284c7); }
        .bg-multiple { background: rgba(0,0,0,0.3); color: var(--text-primary); border: 1px solid var(--border); }
        .bg-cash { 
          background: linear-gradient(135deg, var(--green), #16a34a); 
          grid-column: span 2; 
          font-size: 16px; 
          box-shadow: 0 4px 15px rgba(34,197,94,0.3);
        }
        .bg-cash:hover {
          box-shadow: 0 8px 25px rgba(34,197,94,0.5);
        }
        
        .pos-products-header {
          padding: 16px;
          display: flex;
          gap: 12px;
          background: rgba(255,255,255,0.02);
          border-bottom: 1px solid var(--border);
        }
        .pos-products-grid {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 16px;
          align-content: start;
        }
        .pos-product-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          cursor: pointer;
          overflow: hidden;
          text-align: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pos-product-card:hover { 
          border-color: var(--accent); 
          background: rgba(99,102,241,0.05);
          box-shadow: 0 8px 20px rgba(0,0,0,0.4), 0 0 0 1px var(--accent-glow); 
          transform: translateY(-4px); 
        }
        .pos-product-card:active {
          transform: translateY(-1px);
        }
        .pos-product-img {
          height: 90px;
          background: rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .pos-product-info {
          padding: 10px 8px;
        }
        .pos-product-name {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 6px;
          line-height: 1.3;
          height: 31px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .pos-product-price {
          font-size: 14px;
          font-weight: 700;
          color: var(--green);
        }
      `}),e.jsxs("div",{className:"pos-layout",children:[e.jsx(ge,{open:!j&&!$,mode:"OPEN",activeShift:null,registers:ye,onClose:()=>{}}),e.jsx(ge,{open:fe,mode:"CLOSE",activeShift:j||null,onClose:()=>ee(!1)}),e.jsxs("div",{className:"pos-navbar",children:[e.jsxs("div",{className:"pos-nav-logo",children:[e.jsx("span",{style:{fontWeight:900},children:"Vestix"})," ",e.jsx("span",{style:{fontWeight:300},children:"POS"})]}),e.jsxs("div",{className:"pos-nav-icons",children:[e.jsxs("div",{className:"pos-icon-btn",children:[e.jsx(Ie,{size:16})," ",e.jsx(Ve,{})]}),e.jsxs("button",{className:"pos-icon-btn",onClick:()=>_(!0),title:"Ventas Suspendidas",children:[e.jsx(xe,{size:18})," ",v.length>0&&e.jsx("span",{style:{background:"var(--yellow)",padding:"2px 6px",borderRadius:"10px",fontSize:"11px",fontWeight:"bold"},children:v.length})]}),e.jsx("button",{className:"pos-icon-btn",onClick:we,title:"Pantalla Completa",children:e.jsx(Ke,{size:18})}),e.jsx("button",{className:"pos-icon-btn",onClick:()=>window.open("/calculator","_blank","width=300,height=400"),title:"Calculadora",children:e.jsx(Re,{size:18})}),e.jsxs("button",{className:"pos-icon-btn",onClick:()=>ee(!0),style:{background:"var(--red)",fontWeight:700},title:"Cerrar Caja",children:[e.jsx(ie,{size:16})," Cerrar Caja"]}),e.jsxs("button",{className:"pos-icon-btn",onClick:()=>b("/"),title:"Volver al Dashboard",children:[e.jsx(ie,{size:18})," Volver"]})]})]}),e.jsxs("div",{className:"pos-main",children:[e.jsxs("div",{className:"pos-left",children:[e.jsxs("div",{className:"pos-cart-top",children:[e.jsxs("div",{style:{display:"flex",gap:"10px"},children:[e.jsxs("div",{style:{flex:1,position:"relative"},children:[e.jsx(pe,{size:16,style:{position:"absolute",left:"10px",top:"10px",color:"var(--text-muted)"}}),e.jsxs("select",{value:y,onChange:t=>N(t.target.value),style:{width:"100%",padding:"8px 10px 8px 34px",borderRadius:"4px",border:"1px solid var(--border)",background:"var(--bg-overlay)",color:"var(--text-primary)",fontSize:"14px",outline:"none"},children:[e.jsx("option",{value:"",children:"Cliente Ocasional / Consumidor Final"}),z==null?void 0:z.data.map(t=>e.jsx("option",{value:t.id,children:t.fullName},t.id))]})]}),e.jsx("button",{onClick:()=>q(!0),style:{padding:"0 15px",background:"var(--accent)",color:"var(--text-primary)",border:"none",borderRadius:"4px",cursor:"pointer"},children:e.jsx(ue,{size:18})})]}),e.jsxs("div",{style:{position:"relative"},children:[e.jsx(De,{size:20,style:{position:"absolute",left:"12px",top:"13px",color:"var(--accent)"}}),e.jsx("input",{ref:O,type:"text",className:"pos-search-input",placeholder:"Ingrese el nombre del producto / SKU / Escanear código de barras",value:f,onChange:t=>C(t.target.value),onKeyDown:t=>{t.key==="Enter"&&(E==null?void 0:E.length)===1&&se(E[0])},autoFocus:!0})]})]}),e.jsx("div",{className:"pos-table-container",children:e.jsxs("table",{className:"pos-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:"40%"},children:"Producto"}),e.jsx("th",{style:{width:"15%",textAlign:"center"},children:"Cant."}),e.jsx("th",{style:{width:"15%",textAlign:"right"},children:"Precio"}),e.jsx("th",{style:{width:"10%",textAlign:"right"},children:"Desc%"}),e.jsx("th",{style:{width:"15%",textAlign:"right"},children:"Subtotal"}),e.jsx("th",{style:{width:"5%",textAlign:"center"},children:e.jsx(Le,{size:16})})]})}),e.jsx("tbody",{children:o.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:6,style:{textAlign:"center",padding:"40px",color:"var(--text-muted)"},children:"No hay productos agregados"})}):o.map((t,r)=>e.jsxs("tr",{children:[e.jsxs("td",{style:{fontWeight:600,color:"var(--accent)"},children:[t.variant.productName||"Producto"," ",t.variant.size?`(${t.variant.size})`:""]}),e.jsx("td",{style:{textAlign:"center"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:"4px"},children:[e.jsx("button",{className:"qty-btn",onClick:()=>B(t.variant.id,t.qty-1),children:e.jsx(We,{size:14})}),e.jsx("input",{type:"number",className:"pos-qty-input",value:t.qty,onChange:s=>B(t.variant.id,Number(s.target.value))}),e.jsx("button",{className:"qty-btn",onClick:()=>B(t.variant.id,t.qty+1),children:e.jsx(ue,{size:14})})]})}),e.jsx("td",{style:{textAlign:"right"},children:e.jsx("input",{type:"number",style:{width:"70px",textAlign:"right",padding:"2px",border:"1px solid var(--border)",background:"var(--bg-overlay)",color:"var(--text-primary)"},value:t.variant.basePrice,onChange:s=>{const l=Number(s.target.value);p(c=>c.map(u=>u.variant.id===t.variant.id?{...u,variant:{...u.variant,basePrice:l}}:u))}})}),e.jsx("td",{style:{textAlign:"right"},children:e.jsx("input",{type:"number",style:{width:"50px",textAlign:"right",padding:"2px",border:"1px solid var(--border)",background:"var(--bg-overlay)",color:"var(--text-primary)"},value:t.discountPct,onChange:s=>{const l=Number(s.target.value);p(c=>c.map(u=>u.variant.id===t.variant.id?{...u,discountPct:l}:u))}})}),e.jsx("td",{style:{textAlign:"right",fontWeight:"bold"},children:m(t.variant.basePrice*t.qty*(1-t.discountPct/100))}),e.jsx("td",{style:{textAlign:"center"},children:e.jsx("button",{onClick:()=>Se(t.variant.id),style:{color:"var(--red)",background:"none",border:"none",cursor:"pointer"},children:e.jsx(Ue,{size:18})})})]},`${t.variant.id}-${r}`))})]})}),e.jsxs("div",{className:"pos-summary",children:[e.jsxs("div",{className:"pos-summary-row",children:[e.jsxs("span",{children:[e.jsx("b",{children:"Items:"})," ",je]}),e.jsxs("span",{children:[e.jsx("b",{children:"Subtotal:"})," ",m(R)]})]}),e.jsxs("div",{className:"pos-summary-row",style:{alignItems:"center"},children:[e.jsxs("span",{style:{display:"flex",alignItems:"center",gap:"5px"},children:[e.jsx("b",{children:"Descuento %:"}),e.jsx("input",{type:"number",style:{width:"60px",padding:"2px",border:"1px solid var(--border)"},value:k,onChange:t=>w(Number(t.target.value))})]}),e.jsxs("span",{style:{color:"var(--red)"},children:[e.jsx("b",{children:"(-)"})," ",m(ae+te)]})]})]}),e.jsxs("div",{className:"pos-total-row",children:[e.jsx("span",{children:"Total a Pagar"}),e.jsx("span",{children:m(g)})]}),e.jsxs("div",{className:"pos-action-buttons",children:[e.jsxs("button",{className:"pos-btn bg-draft",disabled:o.length===0,onClick:()=>D.mutate("QUOTATION"),children:[e.jsx(le,{size:20})," Borrador"]}),e.jsxs("button",{className:"pos-btn bg-quotation",disabled:o.length===0,onClick:()=>D.mutate("QUOTATION"),children:[e.jsx(le,{size:20})," Cotización"]}),e.jsxs("button",{className:"pos-btn bg-suspend",disabled:o.length===0,onClick:Ce,children:[e.jsx(xe,{size:20})," Suspender"]}),e.jsxs("button",{className:"pos-btn bg-credit",disabled:o.length===0,onClick:()=>L("CUSTOMER_CREDIT"),children:[e.jsx(pe,{size:20})," Crédito"]}),e.jsxs("button",{className:"pos-btn bg-card",disabled:o.length===0,onClick:()=>L("CREDIT_CARD"),children:[e.jsx(Oe,{size:20})," Tarjeta"]}),e.jsxs("button",{className:"pos-btn bg-multiple",disabled:o.length===0,onClick:()=>L("MULTIPLE"),children:[e.jsx(qe,{size:20})," Múltiple"]}),e.jsxs("button",{className:"pos-btn bg-cash",disabled:o.length===0,onClick:()=>L("CASH"),children:[e.jsx(Ae,{size:24})," Efectivo"]})]})]}),e.jsxs("div",{className:"pos-right",children:[e.jsxs("div",{className:"pos-products-header",children:[e.jsx("select",{style:{flex:1,padding:"8px",border:"1px solid var(--border)",borderRadius:"3px"},children:e.jsx("option",{children:"Todas las Categorías"})}),e.jsx("select",{style:{flex:1,padding:"8px",border:"1px solid var(--border)",borderRadius:"3px"},children:e.jsx("option",{children:"Todas las Marcas"})})]}),e.jsx("div",{className:"pos-products-grid",children:(oe=f.length>=2?E:ve)==null?void 0:oe.map(t=>e.jsxs("div",{className:"pos-product-card",onClick:()=>se(t),children:[e.jsx("div",{className:"pos-product-img",children:e.jsx(Qe,{size:32})}),e.jsxs("div",{className:"pos-product-info",children:[e.jsxs("div",{className:"pos-product-name",children:[t.productName||"Producto"," ",t.size?`(${t.size})`:""]}),e.jsx("div",{className:"pos-product-price",children:m(t.basePrice)})]})]},t.id))})]})]}),e.jsx(G,{open:K,onClose:()=>P(!1),title:"Confirmar Pago",children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"20px"},children:[e.jsxs("div",{style:{background:"var(--green)",color:"var(--text-primary)",padding:"20px",textAlign:"center",borderRadius:"4px"},children:[e.jsx("div",{style:{fontSize:"14px",textTransform:"uppercase"},children:"Monto a Pagar"}),e.jsx("div",{style:{fontSize:"42px",fontWeight:700},children:m(g)})]}),a==="CASH"&&e.jsxs("div",{children:[e.jsx("label",{style:{fontWeight:"bold"},children:"Monto Recibido"}),e.jsx(Me,{type:"number",min:g,value:T,onChange:t=>Q(Number(t.target.value)),style:{fontSize:"24px",padding:"10px"}}),T>g&&e.jsxs("div",{style:{marginTop:"15px",color:"var(--red)",fontSize:"20px",fontWeight:"bold"},children:["Vuelto: ",m(T-g)]})]}),e.jsx("div",{children:e.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer"},children:[e.jsx("input",{type:"checkbox",checked:Z,onChange:t=>be(t.target.checked)}),"Imprimir Ticket Fiscal AFIP"]})}),e.jsx(U,{variant:"primary",style:{height:"50px",fontSize:"18px",background:"var(--green)",border:"none"},onClick:()=>D.mutate("CONFIRMED"),loading:D.isPending,children:"Completar Venta"})]})}),e.jsx(G,{open:me,onClose:()=>_(!1),title:"Ventas Suspendidas",children:v.length===0?e.jsx("p",{children:"No hay ventas en suspenso."}):e.jsxs("table",{className:"pos-table",style:{border:"1px solid #ddd"},children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Fecha"}),e.jsx("th",{children:"Cliente"}),e.jsx("th",{children:"Total"}),e.jsx("th",{children:"Acción"})]})}),e.jsx("tbody",{children:v.map(t=>{var r;return e.jsxs("tr",{children:[e.jsx("td",{children:new Date(t.date).toLocaleString()}),e.jsx("td",{children:((r=z==null?void 0:z.data.find(s=>s.id===t.customerId))==null?void 0:r.fullName)||"Consumidor Final"}),e.jsx("td",{style:{fontWeight:"bold"},children:m(t.total)}),e.jsx("td",{children:e.jsx(U,{variant:"primary",style:{padding:"5px 10px",fontSize:"12px"},onClick:()=>ke(t.id),children:"Retomar"})})]},t.id)})})]})}),e.jsx(Fe,{open:F,onClose:()=>q(!1)})]})]})}export{xt as default};
