import{d as Y,e as he,r as n,z as x,j as e,a as Pe,u as we,x as Ie,m as ze,y as ie,F as le,t as Oe,L as Ae,B as Te,i as de}from"./index-D9D-K8YW.js";import{u as M}from"./useQuery-BYtqm8Nz.js";import{u as J}from"./useMutation--XYt-Ir1.js";import{p as H}from"./pos.api-BctvDoqy.js";import{s as Ee}from"./sales.api-CstvbmI9.js";import{c as qe}from"./customers.api-HqTJozb5.js";import{t as G}from"./treasury.api-C_1rsAQs.js";import{q as ce}from"./queryKeys-DMWeh9yq.js";import{B as U}from"./Button-Cb43VZIn.js";import{I as Me}from"./Input-Dd2TnOnc.js";import{M as X}from"./Modal-BNN5EnPX.js";import{C as Fe}from"./CustomerFormDrawer-CLuOpVOM.js";import{C as Re}from"./calculator-nj5xTATv.js";import{U as pe}from"./user-BnBrZN_0.js";import{P as ue}from"./plus-DmY2ku8z.js";import{S as De}from"./search-BPHvT-QX.js";import{T as Le}from"./trash-2-DZijGDuD.js";import{M as We}from"./minus-BsdFA5_P.js";import{C as Ue}from"./circle-x-D_LmYcwm.js";import"./requestUtils-gaJB49jo.js";import"./x-PNCKApkN.js";import"./Drawer-jiQULfg8.js";/**
 * @license lucide-react v0.396.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xe=Y("CirclePause",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"10",x2:"10",y1:"15",y2:"9",key:"c1nkhi"}],["line",{x1:"14",x2:"14",y1:"15",y2:"9",key:"h65svq"}]]);/**
 * @license lucide-react v0.396.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ke=Y("Maximize",[["path",{d:"M8 3H5a2 2 0 0 0-2 2v3",key:"1dcmit"}],["path",{d:"M21 8V5a2 2 0 0 0-2-2h-3",key:"1e4gt3"}],["path",{d:"M3 16v3a2 2 0 0 0 2 2h3",key:"wsl5sc"}],["path",{d:"M16 21h3a2 2 0 0 0 2-2v-3",key:"18trek"}]]);/**
 * @license lucide-react v0.396.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qe=Y("Tags",[["path",{d:"m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19",key:"1cbfv1"}],["path",{d:"M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z",key:"135mg7"}],["circle",{cx:"6.5",cy:"9.5",r:".5",fill:"currentColor",key:"5pm5xn"}]]);function ge({open:h,onClose:b,mode:d,activeShift:z,cashRegisterId:y,registers:C}){const O=he(),[o,p]=n.useState(""),[k,N]=n.useState(""),[f,P]=n.useState(y||"");n.useEffect(()=>{h&&(p(""),N(""))},[h]);const F=J({mutationFn:()=>G.openShift(f,parseFloat(o)||0),onSuccess:()=>{x.success("Turno abierto exitosamente"),O.invalidateQueries({queryKey:["shifts","active"]}),b()},onError:s=>x.error(s.message||"Error al abrir caja")}),A=J({mutationFn:()=>G.closeShift(z.id,parseFloat(o)||0,k),onSuccess:s=>{const T=s.data||s;if(T.difference!==0){const E=T.difference>0?"SOBRANTE":"FALTANTE";x(`Turno cerrado con ${E} de $${Math.abs(T.difference)}`,{icon:"⚠️"})}else x.success("Turno cerrado exitosamente (Arqueo Exacto)");O.invalidateQueries({queryKey:["shifts","active"]}),b()},onError:s=>x.error(s.message||"Error al cerrar caja")}),K=s=>{if(s.preventDefault(),o==="")return x.error("Ingresa un monto");if(d==="OPEN"){if(!f)return x.error("Selecciona una caja");F.mutate()}else{if(!z)return x.error("No hay turno activo");A.mutate()}},w=F.isPending||A.isPending;return e.jsx(X,{open:h,onClose:b,title:d==="OPEN"?"Apertura de Caja":"Cierre de Caja (Arqueo Ciego)",children:e.jsxs("form",{onSubmit:K,style:{display:"flex",flexDirection:"column",gap:"16px"},children:[d==="OPEN"&&e.jsxs("p",{style:{fontSize:"13px",color:"var(--text-secondary)"},children:["Para poder facturar en el POS necesitas abrir un turno. Ingresa el ",e.jsx("strong",{children:"Fondo de Caja"})," (dinero inicial para cambio)."]}),d==="CLOSE"&&e.jsx("p",{style:{fontSize:"13px",color:"var(--text-secondary)"},children:"Cuenta los billetes y monedas en la caja y declara el total. El sistema registrará cualquier diferencia automáticamente."}),d==="OPEN"&&C&&C.length>0&&e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("label",{style:{fontSize:"13px",fontWeight:600},children:"Seleccionar Caja"}),e.jsxs("select",{value:f,onChange:s=>P(s.target.value),style:{padding:"10px 12px",borderRadius:"6px",border:"1px solid var(--border)",fontSize:"14px",background:"var(--bg-base)"},children:[e.jsx("option",{value:"",children:"-- Cajas Disponibles --"}),C.map(s=>e.jsx("option",{value:s.id,children:s.name},s.id))]})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("label",{style:{fontSize:"13px",fontWeight:600},children:d==="OPEN"?"Saldo Inicial (Efectivo)":"Dinero Físico Contado"}),e.jsx("input",{type:"number",step:"0.01",value:o,onChange:s=>p(s.target.value),placeholder:"0.00",style:{padding:"10px 12px",borderRadius:"6px",border:"1px solid var(--border)",fontSize:"16px",fontWeight:600},autoFocus:!0})]}),d==="CLOSE"&&e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("label",{style:{fontSize:"13px",fontWeight:600},children:"Notas / Observaciones (Opcional)"}),e.jsx("input",{type:"text",value:k,onChange:s=>N(s.target.value),placeholder:"Ej: Faltan $10 por compra de agua",style:{padding:"10px 12px",borderRadius:"6px",border:"1px solid var(--border)"}})]}),e.jsxs("div",{style:{display:"flex",justifyContent:"flex-end",gap:"12px",marginTop:"8px"},children:[d==="CLOSE"&&e.jsx(U,{variant:"ghost",onClick:b,disabled:w,children:"Cancelar"}),e.jsx(U,{variant:"primary",type:"submit",loading:w,children:d==="OPEN"?"Abrir Turno":"Cerrar Turno"})]})]})})}function Ve(){const[h,b]=n.useState(new Date);return n.useEffect(()=>{const d=setInterval(()=>b(new Date),1e3);return()=>clearInterval(d)},[]),e.jsx("span",{children:h.toLocaleTimeString()})}function xt(){var oe;const h=he(),b=Pe(),{user:d}=we(),z=Ie(t=>t.enqueue),[y,C]=n.useState(""),O=n.useRef(null),[o,p]=n.useState([]),[k,N]=n.useState(0),[f,P]=n.useState(""),[F,A]=n.useState(!1),[K,w]=n.useState(!1),[s,T]=n.useState("CASH"),[E,Q]=n.useState(0),[Z,be]=n.useState(!1),[v,V]=n.useState([]),[me,_]=n.useState(!1),[ye,ee]=n.useState(!1);n.useEffect(()=>{const t=localStorage.getItem("vestix_suspended_sales");t&&V(JSON.parse(t))},[]);const{data:j,isLoading:$}=M({queryKey:["shifts","active"],queryFn:()=>G.getActiveShift()}),S=(d==null?void 0:d.branchId)||"",{data:fe}=M({queryKey:ce.pos.registers(S),queryFn:()=>H.getAvailableRegisters(S),enabled:!$&&!j}),{data:ve}=M({queryKey:["pos","gridProducts"],queryFn:()=>H.searchProduct("")}),{data:q}=M({queryKey:["pos","search",y],queryFn:()=>H.searchProduct(y),enabled:y.length>=2}),{data:I}=M({queryKey:ce.customers.all(),queryFn:()=>qe.getCustomers({pageSize:1e3})}),je=o.reduce((t,r)=>t+r.qty,0),R=o.reduce((t,r)=>t+r.variant.basePrice*r.qty,0),te=o.reduce((t,r)=>t+r.variant.basePrice*r.qty*(r.discountPct/100),0),re=R-te,se=re*(k/100),g=re-se,m=t=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS"}).format(t),ae=t=>{var r;p(a=>a.find(c=>c.variant.id===t.id)?a.map(c=>c.variant.id===t.id?{...c,qty:c.qty+1}:c):[...a,{variant:t,qty:1,discountPct:0}]),C(""),(r=O.current)==null||r.focus()},B=(t,r)=>{r<1||p(a=>a.map(l=>l.variant.id===t?{...l,qty:r}:l))},Se=t=>{p(r=>r.filter(a=>a.variant.id!==t))},Ce=()=>{if(o.length===0)return;const t={id:crypto.randomUUID(),date:new Date().toISOString(),cart:o,customerId:f,discount:k,total:g},r=[...v,t];V(r),localStorage.setItem("vestix_suspended_sales",JSON.stringify(r)),x.success("Venta suspendida (Hold)"),p([]),P("")},ke=t=>{const r=v.find(l=>l.id===t);if(!r)return;p(r.cart),P(r.customerId),N(r.discount);const a=v.filter(l=>l.id!==t);V(a),localStorage.setItem("vestix_suspended_sales",JSON.stringify(a)),_(!1)},D=J({mutationFn:async(t="CONFIRMED")=>{var u,ne;if(!j)throw new Error("No hay sesión de caja activa");const r=crypto.randomUUID();let a="main";try{const i=await h.fetchQuery({queryKey:["warehouses",S],queryFn:()=>de("/inventory/warehouses",{params:{branchId:S}}),staleTime:6e5});a=((u=i==null?void 0:i[0])==null?void 0:u.id)||"main"}catch{a="main"}let l;try{const i=await h.fetchQuery({queryKey:["accounts",S],queryFn:()=>de("/finance/accounts",{params:{branchId:S}}),staleTime:6e5});l=(ne=i==null?void 0:i.find(W=>W.isActive))==null?void 0:ne.id}catch{l=void 0}const c={id:r,branchId:S,warehouseId:a,customerId:f||void 0,source:"POS",paymentMethod:s==="MULTIPLE"?"CASH":s,paymentAccountId:l,cashShiftId:j==null?void 0:j.id,status:t==="QUOTATION"?"QUOTE":"COMPLETED",posGrandTotal:g,cartDiscountTotal:g<R?R-g:0,createdAtIso:new Date().toISOString(),lines:o.map(i=>{var W;return{variantId:i.variant.id,categoryId:((W=i.variant.product)==null?void 0:W.categoryId)||"default",quantity:i.qty,unitPriceOverride:i.variant.basePrice,discountPct:i.discountPct}}),issueInvoice:Z};if(!navigator.onLine)return z({module:"POS",action:"createSale",description:"Venta POS offline",endpoint:"/sales/checkout",method:"POST",maxRetries:5,payload:c}),{offline:!0};try{return{offline:!1,res:await Ee.createSale(c)}}catch(i){if(!i.response||i.code==="ERR_NETWORK")return z({module:"POS",action:"createSale",description:"Venta POS offline",endpoint:"/sales/checkout",method:"POST",maxRetries:5,payload:c}),{offline:!0};throw i}},onSuccess:(t,r)=>{x.success(t!=null&&t.offline?"Registrado offline":r==="QUOTATION"?"Presupuesto Creado":"Venta Pagada!"),p([]),N(0),P(""),w(!1),Q(0)},onError:t=>x.error(t.message||"Error al cobrar")}),L=t=>{o.length!==0&&(T(t),Q(g),w(!0))},Ne=()=>{document.fullscreenElement?document.exitFullscreen&&document.exitFullscreen():document.documentElement.requestFullscreen().catch(t=>console.log(t))};return $?e.jsx("div",{style:{padding:"40px",textAlign:"center",fontWeight:600},children:"Cargando estado de caja..."}):e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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
          background: var(--bg-elevated);
          color: var(--text-primary);
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 15px;
          border-bottom: 1px solid var(--border);
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
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 4px;
        }
        .pos-icon-btn:hover { background: var(--bg-overlay); color: var(--text-primary); }
        .pos-main {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        .pos-left {
          flex: 6.5;
          display: flex;
          flex-direction: column;
          background: var(--bg-base);
          border-right: 1px solid var(--border);
        }
        .pos-right {
          flex: 3.5;
          display: flex;
          flex-direction: column;
          background: var(--bg-surface);
        }
        .pos-cart-top {
          padding: 10px;
          background: var(--bg-elevated);
          border-bottom: 1px solid var(--border);
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
          border: 1px solid var(--border);
          background: var(--bg-overlay);
          color: var(--text-primary);
          border-radius: 4px;
          font-size: 16px;
          outline: none;
        }
        .pos-search-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent-glow);
        }
        .pos-table-container {
          flex: 1;
          overflow-y: auto;
          background: var(--bg-base);
        }
        .pos-table {
          width: 100%;
          border-collapse: collapse;
        }
        .pos-table th {
          background: var(--bg-elevated);
          padding: 10px;
          text-align: left;
          font-size: 13px;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
        }
        .pos-table td {
          padding: 8px 10px;
          border-bottom: 1px solid var(--border);
          font-size: 14px;
          vertical-align: middle;
          color: var(--text-primary);
        }
        .pos-qty-input {
          width: 50px;
          text-align: center;
          padding: 4px;
          border: 1px solid var(--border);
          background: var(--bg-overlay);
          color: var(--text-primary);
          border-radius: 3px;
        }
        .pos-summary {
          background: var(--bg-elevated);
          border-top: 1px solid var(--border);
          padding: 10px 15px;
        }
        .pos-summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          margin-bottom: 5px;
          color: var(--text-secondary);
        }
        .pos-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-overlay);
          padding: 10px 15px;
          font-size: 24px;
          font-weight: 700;
          color: var(--accent);
          border-radius: 4px;
        }
        .pos-action-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 5px;
          padding: 10px;
          background: var(--bg-elevated);
        }
        .pos-btn {
          padding: 15px 5px;
          color: var(--text-primary);
          border: none;
          border-radius: 4px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          transition: opacity 0.2s;
        }
        .pos-btn:hover { opacity: 0.8; }
        .pos-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .bg-draft { background: var(--yellow); }
        .bg-quotation { background: var(--blue); }
        .bg-suspend { background: var(--red); }
        .bg-credit { background: var(--purple); }
        .bg-card { background: var(--blue); }
        .bg-multiple { background: var(--bg-overlay); color: var(--text-primary); border: 1px solid var(--border); }
        .bg-cash { background: var(--green); grid-column: span 2; font-size: 16px; }
        
        .pos-products-header {
          padding: 10px;
          display: flex;
          gap: 10px;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border);
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
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          cursor: pointer;
          overflow: hidden;
          text-align: center;
          transition: all 0.2s;
        }
        .pos-product-card:hover { border-color: var(--accent); box-shadow: 0 4px 12px rgba(0,0,0,0.2); transform: translateY(-2px); }
        .pos-product-img {
          height: 80px;
          background: var(--bg-overlay);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }
        .pos-product-info {
          padding: 8px 5px;
        }
        .pos-product-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
          line-height: 1.2;
          height: 28px;
          overflow: hidden;
        }
        .pos-product-price {
          font-size: 13px;
          font-weight: 700;
          color: var(--green);
        }
      `}),e.jsxs("div",{className:"pos-layout",children:[e.jsx(ge,{open:!j&&!$,mode:"OPEN",activeShift:null,registers:fe,onClose:()=>{}}),e.jsx(ge,{open:ye,mode:"CLOSE",activeShift:j||null,onClose:()=>ee(!1)}),e.jsxs("div",{className:"pos-navbar",children:[e.jsxs("div",{className:"pos-nav-logo",children:[e.jsx("span",{style:{fontWeight:900},children:"Vestix"})," ",e.jsx("span",{style:{fontWeight:300},children:"POS"})]}),e.jsxs("div",{className:"pos-nav-icons",children:[e.jsxs("div",{className:"pos-icon-btn",children:[e.jsx(ze,{size:16})," ",e.jsx(Ve,{})]}),e.jsxs("button",{className:"pos-icon-btn",onClick:()=>_(!0),title:"Ventas Suspendidas",children:[e.jsx(xe,{size:18})," ",v.length>0&&e.jsx("span",{style:{background:"var(--yellow)",padding:"2px 6px",borderRadius:"10px",fontSize:"11px",fontWeight:"bold"},children:v.length})]}),e.jsx("button",{className:"pos-icon-btn",onClick:Ne,title:"Pantalla Completa",children:e.jsx(Ke,{size:18})}),e.jsx("button",{className:"pos-icon-btn",onClick:()=>window.open("/calculator","_blank","width=300,height=400"),title:"Calculadora",children:e.jsx(Re,{size:18})}),e.jsxs("button",{className:"pos-icon-btn",onClick:()=>ee(!0),style:{background:"var(--red)",fontWeight:700},title:"Cerrar Caja",children:[e.jsx(ie,{size:16})," Cerrar Caja"]}),e.jsxs("button",{className:"pos-icon-btn",onClick:()=>b("/"),title:"Volver al Dashboard",children:[e.jsx(ie,{size:18})," Volver"]})]})]}),e.jsxs("div",{className:"pos-main",children:[e.jsxs("div",{className:"pos-left",children:[e.jsxs("div",{className:"pos-cart-top",children:[e.jsxs("div",{style:{display:"flex",gap:"10px"},children:[e.jsxs("div",{style:{flex:1,position:"relative"},children:[e.jsx(pe,{size:16,style:{position:"absolute",left:"10px",top:"10px",color:"var(--text-muted)"}}),e.jsxs("select",{value:f,onChange:t=>P(t.target.value),style:{width:"100%",padding:"8px 10px 8px 34px",borderRadius:"4px",border:"1px solid var(--border)",background:"var(--bg-overlay)",color:"var(--text-primary)",fontSize:"14px",outline:"none"},children:[e.jsx("option",{value:"",children:"Cliente Ocasional / Consumidor Final"}),I==null?void 0:I.data.map(t=>e.jsx("option",{value:t.id,children:t.fullName},t.id))]})]}),e.jsx("button",{onClick:()=>A(!0),style:{padding:"0 15px",background:"var(--accent)",color:"var(--text-primary)",border:"none",borderRadius:"4px",cursor:"pointer"},children:e.jsx(ue,{size:18})})]}),e.jsxs("div",{style:{position:"relative"},children:[e.jsx(De,{size:20,style:{position:"absolute",left:"12px",top:"13px",color:"var(--accent)"}}),e.jsx("input",{ref:O,type:"text",className:"pos-search-input",placeholder:"Ingrese el nombre del producto / SKU / Escanear código de barras",value:y,onChange:t=>C(t.target.value),onKeyDown:t=>{t.key==="Enter"&&(q==null?void 0:q.length)===1&&ae(q[0])},autoFocus:!0})]})]}),e.jsx("div",{className:"pos-table-container",children:e.jsxs("table",{className:"pos-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:"40%"},children:"Producto"}),e.jsx("th",{style:{width:"15%",textAlign:"center"},children:"Cant."}),e.jsx("th",{style:{width:"15%",textAlign:"right"},children:"Precio"}),e.jsx("th",{style:{width:"10%",textAlign:"right"},children:"Desc%"}),e.jsx("th",{style:{width:"15%",textAlign:"right"},children:"Subtotal"}),e.jsx("th",{style:{width:"5%",textAlign:"center"},children:e.jsx(Le,{size:16})})]})}),e.jsx("tbody",{children:o.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:6,style:{textAlign:"center",padding:"40px",color:"var(--text-muted)"},children:"No hay productos agregados"})}):o.map((t,r)=>e.jsxs("tr",{children:[e.jsxs("td",{style:{fontWeight:600,color:"var(--accent)"},children:[t.variant.productName||"Producto"," ",t.variant.size?`(${t.variant.size})`:""]}),e.jsx("td",{style:{textAlign:"center"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center"},children:[e.jsx("button",{onClick:()=>B(t.variant.id,t.qty-1),style:{padding:"2px",border:"1px solid var(--border)",background:"var(--bg-overlay)",cursor:"pointer"},children:e.jsx(We,{size:12})}),e.jsx("input",{type:"number",className:"pos-qty-input",value:t.qty,onChange:a=>B(t.variant.id,Number(a.target.value))}),e.jsx("button",{onClick:()=>B(t.variant.id,t.qty+1),style:{padding:"2px",border:"1px solid var(--border)",background:"var(--bg-overlay)",cursor:"pointer"},children:e.jsx(ue,{size:12})})]})}),e.jsx("td",{style:{textAlign:"right"},children:e.jsx("input",{type:"number",style:{width:"70px",textAlign:"right",padding:"2px",border:"1px solid var(--border)",background:"var(--bg-overlay)",color:"var(--text-primary)"},value:t.variant.basePrice,onChange:a=>{const l=Number(a.target.value);p(c=>c.map(u=>u.variant.id===t.variant.id?{...u,variant:{...u.variant,basePrice:l}}:u))}})}),e.jsx("td",{style:{textAlign:"right"},children:e.jsx("input",{type:"number",style:{width:"50px",textAlign:"right",padding:"2px",border:"1px solid var(--border)",background:"var(--bg-overlay)",color:"var(--text-primary)"},value:t.discountPct,onChange:a=>{const l=Number(a.target.value);p(c=>c.map(u=>u.variant.id===t.variant.id?{...u,discountPct:l}:u))}})}),e.jsx("td",{style:{textAlign:"right",fontWeight:"bold"},children:m(t.variant.basePrice*t.qty*(1-t.discountPct/100))}),e.jsx("td",{style:{textAlign:"center"},children:e.jsx("button",{onClick:()=>Se(t.variant.id),style:{color:"var(--red)",background:"none",border:"none",cursor:"pointer"},children:e.jsx(Ue,{size:18})})})]},`${t.variant.id}-${r}`))})]})}),e.jsxs("div",{className:"pos-summary",children:[e.jsxs("div",{className:"pos-summary-row",children:[e.jsxs("span",{children:[e.jsx("b",{children:"Items:"})," ",je]}),e.jsxs("span",{children:[e.jsx("b",{children:"Subtotal:"})," ",m(R)]})]}),e.jsxs("div",{className:"pos-summary-row",style:{alignItems:"center"},children:[e.jsxs("span",{style:{display:"flex",alignItems:"center",gap:"5px"},children:[e.jsx("b",{children:"Descuento %:"}),e.jsx("input",{type:"number",style:{width:"60px",padding:"2px",border:"1px solid var(--border)"},value:k,onChange:t=>N(Number(t.target.value))})]}),e.jsxs("span",{style:{color:"var(--red)"},children:[e.jsx("b",{children:"(-)"})," ",m(se+te)]})]})]}),e.jsxs("div",{className:"pos-total-row",children:[e.jsx("span",{children:"Total a Pagar"}),e.jsx("span",{children:m(g)})]}),e.jsxs("div",{className:"pos-action-buttons",children:[e.jsxs("button",{className:"pos-btn bg-draft",disabled:o.length===0,onClick:()=>D.mutate("QUOTATION"),children:[e.jsx(le,{size:20})," Borrador"]}),e.jsxs("button",{className:"pos-btn bg-quotation",disabled:o.length===0,onClick:()=>D.mutate("QUOTATION"),children:[e.jsx(le,{size:20})," Cotización"]}),e.jsxs("button",{className:"pos-btn bg-suspend",disabled:o.length===0,onClick:Ce,children:[e.jsx(xe,{size:20})," Suspender"]}),e.jsxs("button",{className:"pos-btn bg-credit",disabled:o.length===0,onClick:()=>L("CUSTOMER_CREDIT"),children:[e.jsx(pe,{size:20})," Crédito"]}),e.jsxs("button",{className:"pos-btn bg-card",disabled:o.length===0,onClick:()=>L("CREDIT_CARD"),children:[e.jsx(Oe,{size:20})," Tarjeta"]}),e.jsxs("button",{className:"pos-btn bg-multiple",disabled:o.length===0,onClick:()=>L("MULTIPLE"),children:[e.jsx(Ae,{size:20})," Múltiple"]}),e.jsxs("button",{className:"pos-btn bg-cash",disabled:o.length===0,onClick:()=>L("CASH"),children:[e.jsx(Te,{size:24})," Efectivo"]})]})]}),e.jsxs("div",{className:"pos-right",children:[e.jsxs("div",{className:"pos-products-header",children:[e.jsx("select",{style:{flex:1,padding:"8px",border:"1px solid var(--border)",borderRadius:"3px"},children:e.jsx("option",{children:"Todas las Categorías"})}),e.jsx("select",{style:{flex:1,padding:"8px",border:"1px solid var(--border)",borderRadius:"3px"},children:e.jsx("option",{children:"Todas las Marcas"})})]}),e.jsx("div",{className:"pos-products-grid",children:(oe=y.length>=2?q:ve)==null?void 0:oe.map(t=>e.jsxs("div",{className:"pos-product-card",onClick:()=>ae(t),children:[e.jsx("div",{className:"pos-product-img",children:e.jsx(Qe,{size:32})}),e.jsxs("div",{className:"pos-product-info",children:[e.jsxs("div",{className:"pos-product-name",children:[t.productName||"Producto"," ",t.size?`(${t.size})`:""]}),e.jsx("div",{className:"pos-product-price",children:m(t.basePrice)})]})]},t.id))})]})]}),e.jsx(X,{open:K,onClose:()=>w(!1),title:"Confirmar Pago",children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"20px"},children:[e.jsxs("div",{style:{background:"var(--green)",color:"var(--text-primary)",padding:"20px",textAlign:"center",borderRadius:"4px"},children:[e.jsx("div",{style:{fontSize:"14px",textTransform:"uppercase"},children:"Monto a Pagar"}),e.jsx("div",{style:{fontSize:"42px",fontWeight:700},children:m(g)})]}),s==="CASH"&&e.jsxs("div",{children:[e.jsx("label",{style:{fontWeight:"bold"},children:"Monto Recibido"}),e.jsx(Me,{type:"number",min:g,value:E,onChange:t=>Q(Number(t.target.value)),style:{fontSize:"24px",padding:"10px"}}),E>g&&e.jsxs("div",{style:{marginTop:"15px",color:"var(--red)",fontSize:"20px",fontWeight:"bold"},children:["Vuelto: ",m(E-g)]})]}),e.jsx("div",{children:e.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer"},children:[e.jsx("input",{type:"checkbox",checked:Z,onChange:t=>be(t.target.checked)}),"Imprimir Ticket Fiscal AFIP"]})}),e.jsx(U,{variant:"primary",style:{height:"50px",fontSize:"18px",background:"var(--green)",border:"none"},onClick:()=>D.mutate("CONFIRMED"),loading:D.isPending,children:"Completar Venta"})]})}),e.jsx(X,{open:me,onClose:()=>_(!1),title:"Ventas Suspendidas",children:v.length===0?e.jsx("p",{children:"No hay ventas en suspenso."}):e.jsxs("table",{className:"pos-table",style:{border:"1px solid #ddd"},children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Fecha"}),e.jsx("th",{children:"Cliente"}),e.jsx("th",{children:"Total"}),e.jsx("th",{children:"Acción"})]})}),e.jsx("tbody",{children:v.map(t=>{var r;return e.jsxs("tr",{children:[e.jsx("td",{children:new Date(t.date).toLocaleString()}),e.jsx("td",{children:((r=I==null?void 0:I.data.find(a=>a.id===t.customerId))==null?void 0:r.fullName)||"Consumidor Final"}),e.jsx("td",{style:{fontWeight:"bold"},children:m(t.total)}),e.jsx("td",{children:e.jsx(U,{variant:"primary",style:{padding:"5px 10px",fontSize:"12px"},onClick:()=>ke(t.id),children:"Retomar"})})]},t.id)})})]})}),e.jsx(Fe,{open:F,onClose:()=>A(!1)})]})]})}export{xt as default};
