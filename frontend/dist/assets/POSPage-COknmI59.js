import{d as Y,e as fe,r as o,z as x,j as e,a as Pe,u as we,x as Ie,m as ze,y as ie,F as le,t as Oe,L as Ae,B as Te,i as de}from"./index-Y4U9aC7c.js";import{u as M}from"./useQuery-DxJyx_lQ.js";import{u as J}from"./useMutation-C2jIK4rh.js";import{p as H}from"./pos.api-DPNl3670.js";import{s as Ee}from"./sales.api-C1MnKfqn.js";import{c as qe}from"./customers.api-C-5K-tn6.js";import{t as G}from"./treasury.api-D9sMTM3z.js";import{q as ce}from"./queryKeys-DMWeh9yq.js";import{B as U}from"./Button-CNfxENFk.js";import{I as Me}from"./Input-CdLTMsUC.js";import{M as X}from"./Modal-CQ1efYJK.js";import{C as Fe}from"./CustomerFormDrawer-_jqYoSjX.js";import{C as Re}from"./calculator-C1sQF1pq.js";import{U as pe}from"./user-C93ZHHEk.js";import{P as ue}from"./plus-CLQVt0l0.js";import{S as De}from"./search-BEwiSWzo.js";import{T as Le}from"./trash-2-D96i84o7.js";import{M as We}from"./minus-LcgzWWXZ.js";import{C as Ue}from"./circle-x-Brg87d9Z.js";import"./requestUtils-gaJB49jo.js";import"./x-C8DfiaTU.js";import"./Drawer-BCPP39XJ.js";/**
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
 */const Qe=Y("Tags",[["path",{d:"m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19",key:"1cbfv1"}],["path",{d:"M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z",key:"135mg7"}],["circle",{cx:"6.5",cy:"9.5",r:".5",fill:"currentColor",key:"5pm5xn"}]]);function he({open:f,onClose:g,mode:d,activeShift:z,cashRegisterId:b,registers:C}){const O=fe(),[r,p]=o.useState(""),[k,N]=o.useState(""),[y,P]=o.useState(b||"");o.useEffect(()=>{f&&(p(""),N(""))},[f]);const F=J({mutationFn:()=>G.openShift(y,parseFloat(r)||0),onSuccess:()=>{x.success("Turno abierto exitosamente"),O.invalidateQueries({queryKey:["shifts","active"]}),g()},onError:n=>x.error(n.message||"Error al abrir caja")}),A=J({mutationFn:()=>G.closeShift(z.id,parseFloat(r)||0,k),onSuccess:n=>{const T=n.data||n;if(T.difference!==0){const E=T.difference>0?"SOBRANTE":"FALTANTE";x(`Turno cerrado con ${E} de $${Math.abs(T.difference)}`,{icon:"⚠️"})}else x.success("Turno cerrado exitosamente (Arqueo Exacto)");O.invalidateQueries({queryKey:["shifts","active"]}),g()},onError:n=>x.error(n.message||"Error al cerrar caja")}),K=n=>{if(n.preventDefault(),r==="")return x.error("Ingresa un monto");if(d==="OPEN"){if(!y)return x.error("Selecciona una caja");F.mutate()}else{if(!z)return x.error("No hay turno activo");A.mutate()}},w=F.isPending||A.isPending;return e.jsx(X,{open:f,onClose:g,title:d==="OPEN"?"Apertura de Caja":"Cierre de Caja (Arqueo Ciego)",children:e.jsxs("form",{onSubmit:K,style:{display:"flex",flexDirection:"column",gap:"16px"},children:[d==="OPEN"&&e.jsxs("p",{style:{fontSize:"13px",color:"var(--text-secondary)"},children:["Para poder facturar en el POS necesitas abrir un turno. Ingresa el ",e.jsx("strong",{children:"Fondo de Caja"})," (dinero inicial para cambio)."]}),d==="CLOSE"&&e.jsx("p",{style:{fontSize:"13px",color:"var(--text-secondary)"},children:"Cuenta los billetes y monedas en la caja y declara el total. El sistema registrará cualquier diferencia automáticamente."}),d==="OPEN"&&C&&C.length>0&&e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("label",{style:{fontSize:"13px",fontWeight:600},children:"Seleccionar Caja"}),e.jsxs("select",{value:y,onChange:n=>P(n.target.value),style:{padding:"10px 12px",borderRadius:"6px",border:"1px solid var(--border)",fontSize:"14px",background:"var(--bg-base)"},children:[e.jsx("option",{value:"",children:"-- Cajas Disponibles --"}),C.map(n=>e.jsx("option",{value:n.id,children:n.name},n.id))]})]}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("label",{style:{fontSize:"13px",fontWeight:600},children:d==="OPEN"?"Saldo Inicial (Efectivo)":"Dinero Físico Contado"}),e.jsx("input",{type:"number",step:"0.01",value:r,onChange:n=>p(n.target.value),placeholder:"0.00",style:{padding:"10px 12px",borderRadius:"6px",border:"1px solid var(--border)",fontSize:"16px",fontWeight:600},autoFocus:!0})]}),d==="CLOSE"&&e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"6px"},children:[e.jsx("label",{style:{fontSize:"13px",fontWeight:600},children:"Notas / Observaciones (Opcional)"}),e.jsx("input",{type:"text",value:k,onChange:n=>N(n.target.value),placeholder:"Ej: Faltan $10 por compra de agua",style:{padding:"10px 12px",borderRadius:"6px",border:"1px solid var(--border)"}})]}),e.jsxs("div",{style:{display:"flex",justifyContent:"flex-end",gap:"12px",marginTop:"8px"},children:[d==="CLOSE"&&e.jsx(U,{variant:"ghost",onClick:g,disabled:w,children:"Cancelar"}),e.jsx(U,{variant:"primary",type:"submit",loading:w,children:d==="OPEN"?"Abrir Turno":"Cerrar Turno"})]})]})})}function Ve(){const[f,g]=o.useState(new Date);return o.useEffect(()=>{const d=setInterval(()=>g(new Date),1e3);return()=>clearInterval(d)},[]),e.jsx("span",{children:f.toLocaleTimeString()})}function xt(){var re;const f=fe(),g=Pe(),{user:d}=we(),z=Ie(t=>t.enqueue),[b,C]=o.useState(""),O=o.useRef(null),[r,p]=o.useState([]),[k,N]=o.useState(0),[y,P]=o.useState(""),[F,A]=o.useState(!1),[K,w]=o.useState(!1),[n,T]=o.useState("CASH"),[E,Q]=o.useState(0),[Z,ge]=o.useState(!1),[j,V]=o.useState([]),[me,_]=o.useState(!1),[be,ee]=o.useState(!1);o.useEffect(()=>{const t=localStorage.getItem("vestix_suspended_sales");t&&V(JSON.parse(t))},[]);const{data:v,isLoading:$}=M({queryKey:["shifts","active"],queryFn:()=>G.getActiveShift()}),S=(d==null?void 0:d.branchId)||"",{data:ye}=M({queryKey:ce.pos.registers(S),queryFn:()=>H.getAvailableRegisters(S),enabled:!$&&!v}),{data:je}=M({queryKey:["pos","gridProducts"],queryFn:()=>H.searchProduct("")}),{data:q}=M({queryKey:["pos","search",b],queryFn:()=>H.searchProduct(b),enabled:b.length>=2}),{data:I}=M({queryKey:ce.customers.all(),queryFn:()=>qe.getCustomers({pageSize:1e3})}),ve=r.reduce((t,s)=>t+s.qty,0),R=r.reduce((t,s)=>t+s.variant.basePrice*s.qty,0),te=r.reduce((t,s)=>t+s.variant.basePrice*s.qty*(s.discountPct/100),0),se=R-te,ne=se*(k/100),h=se-ne,m=t=>new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS"}).format(t),ae=t=>{var s;p(a=>a.find(c=>c.variant.id===t.id)?a.map(c=>c.variant.id===t.id?{...c,qty:c.qty+1}:c):[...a,{variant:t,qty:1,discountPct:0}]),C(""),(s=O.current)==null||s.focus()},B=(t,s)=>{s<1||p(a=>a.map(l=>l.variant.id===t?{...l,qty:s}:l))},Se=t=>{p(s=>s.filter(a=>a.variant.id!==t))},Ce=()=>{if(r.length===0)return;const t={id:crypto.randomUUID(),date:new Date().toISOString(),cart:r,customerId:y,discount:k,total:h},s=[...j,t];V(s),localStorage.setItem("vestix_suspended_sales",JSON.stringify(s)),x.success("Venta suspendida (Hold)"),p([]),P("")},ke=t=>{const s=j.find(l=>l.id===t);if(!s)return;p(s.cart),P(s.customerId),N(s.discount);const a=j.filter(l=>l.id!==t);V(a),localStorage.setItem("vestix_suspended_sales",JSON.stringify(a)),_(!1)},D=J({mutationFn:async(t="CONFIRMED")=>{var u,oe;if(!v)throw new Error("No hay sesión de caja activa");const s=crypto.randomUUID();let a="main";try{const i=await f.fetchQuery({queryKey:["warehouses",S],queryFn:()=>de("/inventory/warehouses",{params:{branchId:S}}),staleTime:6e5});a=((u=i==null?void 0:i[0])==null?void 0:u.id)||"main"}catch{a="main"}let l;try{const i=await f.fetchQuery({queryKey:["accounts",S],queryFn:()=>de("/finance/accounts",{params:{branchId:S}}),staleTime:6e5});l=(oe=i==null?void 0:i.find(W=>W.isActive))==null?void 0:oe.id}catch{l=void 0}const c={id:s,branchId:S,warehouseId:a,customerId:y||void 0,source:"POS",paymentMethod:n==="MULTIPLE"?"CASH":n,paymentAccountId:l,cashShiftId:v==null?void 0:v.id,status:t==="QUOTATION"?"QUOTE":"COMPLETED",posGrandTotal:h,cartDiscountTotal:h<R?R-h:0,createdAtIso:new Date().toISOString(),lines:r.map(i=>{var W;return{variantId:i.variant.id,categoryId:((W=i.variant.product)==null?void 0:W.categoryId)||"default",quantity:i.qty,unitPriceOverride:i.variant.basePrice,discountPct:i.discountPct}}),issueInvoice:Z};if(!navigator.onLine)return z({module:"POS",action:"createSale",description:"Venta POS offline",endpoint:"/sales/checkout",method:"POST",maxRetries:5,payload:c}),{offline:!0};try{return{offline:!1,res:await Ee.createSale(c)}}catch(i){if(!i.response||i.code==="ERR_NETWORK")return z({module:"POS",action:"createSale",description:"Venta POS offline",endpoint:"/sales/checkout",method:"POST",maxRetries:5,payload:c}),{offline:!0};throw i}},onSuccess:(t,s)=>{x.success(t!=null&&t.offline?"Registrado offline":s==="QUOTATION"?"Presupuesto Creado":"Venta Pagada!"),p([]),N(0),P(""),w(!1),Q(0)},onError:t=>x.error(t.message||"Error al cobrar")}),L=t=>{r.length!==0&&(T(t),Q(h),w(!0))},Ne=()=>{document.fullscreenElement?document.exitFullscreen&&document.exitFullscreen():document.documentElement.requestFullscreen().catch(t=>console.log(t))};return $?e.jsx("div",{style:{padding:"40px",textAlign:"center",fontWeight:600},children:"Cargando estado de caja..."}):e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
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
      `}),e.jsxs("div",{className:"pos-layout",children:[e.jsx(he,{open:!v&&!$,mode:"OPEN",activeShift:null,registers:ye,onClose:()=>{}}),e.jsx(he,{open:be,mode:"CLOSE",activeShift:v||null,onClose:()=>ee(!1)}),e.jsxs("div",{className:"pos-navbar",children:[e.jsxs("div",{className:"pos-nav-logo",children:[e.jsx("span",{style:{fontWeight:900},children:"Vestix"})," ",e.jsx("span",{style:{fontWeight:300},children:"POS"})]}),e.jsxs("div",{className:"pos-nav-icons",children:[e.jsxs("div",{className:"pos-icon-btn",children:[e.jsx(ze,{size:16})," ",e.jsx(Ve,{})]}),e.jsxs("button",{className:"pos-icon-btn",onClick:()=>_(!0),title:"Ventas Suspendidas",children:[e.jsx(xe,{size:18})," ",j.length>0&&e.jsx("span",{style:{background:"#f39c12",padding:"2px 6px",borderRadius:"10px",fontSize:"11px",fontWeight:"bold"},children:j.length})]}),e.jsx("button",{className:"pos-icon-btn",onClick:Ne,title:"Pantalla Completa",children:e.jsx(Ke,{size:18})}),e.jsx("button",{className:"pos-icon-btn",onClick:()=>window.open("/calculator","_blank","width=300,height=400"),title:"Calculadora",children:e.jsx(Re,{size:18})}),e.jsxs("button",{className:"pos-icon-btn",onClick:()=>ee(!0),style:{background:"#dd4b39",fontWeight:700},title:"Cerrar Caja",children:[e.jsx(ie,{size:16})," Cerrar Caja"]}),e.jsxs("button",{className:"pos-icon-btn",onClick:()=>g("/"),title:"Volver al Dashboard",children:[e.jsx(ie,{size:18})," Volver"]})]})]}),e.jsxs("div",{className:"pos-main",children:[e.jsxs("div",{className:"pos-left",children:[e.jsxs("div",{className:"pos-cart-top",children:[e.jsxs("div",{style:{display:"flex",gap:"10px"},children:[e.jsxs("div",{style:{flex:1,position:"relative"},children:[e.jsx(pe,{size:16,style:{position:"absolute",left:"10px",top:"10px",color:"#999"}}),e.jsxs("select",{value:y,onChange:t=>P(t.target.value),style:{width:"100%",padding:"8px 10px 8px 34px",borderRadius:"4px",border:"1px solid #ccc",fontSize:"14px",outline:"none"},children:[e.jsx("option",{value:"",children:"Cliente Ocasional / Consumidor Final"}),I==null?void 0:I.data.map(t=>e.jsx("option",{value:t.id,children:t.fullName},t.id))]})]}),e.jsx("button",{onClick:()=>A(!0),style:{padding:"0 15px",background:"#3c8dbc",color:"#fff",border:"none",borderRadius:"4px",cursor:"pointer"},children:e.jsx(ue,{size:18})})]}),e.jsxs("div",{style:{position:"relative"},children:[e.jsx(De,{size:20,style:{position:"absolute",left:"12px",top:"13px",color:"#3c8dbc"}}),e.jsx("input",{ref:O,type:"text",className:"pos-search-input",placeholder:"Ingrese el nombre del producto / SKU / Escanear código de barras",value:b,onChange:t=>C(t.target.value),onKeyDown:t=>{t.key==="Enter"&&(q==null?void 0:q.length)===1&&ae(q[0])},autoFocus:!0})]})]}),e.jsx("div",{className:"pos-table-container",children:e.jsxs("table",{className:"pos-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{style:{width:"40%"},children:"Producto"}),e.jsx("th",{style:{width:"15%",textAlign:"center"},children:"Cant."}),e.jsx("th",{style:{width:"15%",textAlign:"right"},children:"Precio"}),e.jsx("th",{style:{width:"10%",textAlign:"right"},children:"Desc%"}),e.jsx("th",{style:{width:"15%",textAlign:"right"},children:"Subtotal"}),e.jsx("th",{style:{width:"5%",textAlign:"center"},children:e.jsx(Le,{size:16})})]})}),e.jsx("tbody",{children:r.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:6,style:{textAlign:"center",padding:"40px",color:"#999"},children:"No hay productos agregados"})}):r.map((t,s)=>e.jsxs("tr",{children:[e.jsxs("td",{style:{fontWeight:600,color:"#3c8dbc"},children:[t.variant.productName||"Producto"," ",t.variant.size?`(${t.variant.size})`:""]}),e.jsx("td",{style:{textAlign:"center"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center"},children:[e.jsx("button",{onClick:()=>B(t.variant.id,t.qty-1),style:{padding:"2px",border:"1px solid #ccc",background:"#f4f4f4",cursor:"pointer"},children:e.jsx(We,{size:12})}),e.jsx("input",{type:"number",className:"pos-qty-input",value:t.qty,onChange:a=>B(t.variant.id,Number(a.target.value))}),e.jsx("button",{onClick:()=>B(t.variant.id,t.qty+1),style:{padding:"2px",border:"1px solid #ccc",background:"#f4f4f4",cursor:"pointer"},children:e.jsx(ue,{size:12})})]})}),e.jsx("td",{style:{textAlign:"right"},children:e.jsx("input",{type:"number",style:{width:"70px",textAlign:"right",padding:"2px",border:"1px solid #ccc"},value:t.variant.basePrice,onChange:a=>{const l=Number(a.target.value);p(c=>c.map(u=>u.variant.id===t.variant.id?{...u,variant:{...u.variant,basePrice:l}}:u))}})}),e.jsx("td",{style:{textAlign:"right"},children:e.jsx("input",{type:"number",style:{width:"50px",textAlign:"right",padding:"2px",border:"1px solid #ccc"},value:t.discountPct,onChange:a=>{const l=Number(a.target.value);p(c=>c.map(u=>u.variant.id===t.variant.id?{...u,discountPct:l}:u))}})}),e.jsx("td",{style:{textAlign:"right",fontWeight:"bold"},children:m(t.variant.basePrice*t.qty*(1-t.discountPct/100))}),e.jsx("td",{style:{textAlign:"center"},children:e.jsx("button",{onClick:()=>Se(t.variant.id),style:{color:"#dd4b39",background:"none",border:"none",cursor:"pointer"},children:e.jsx(Ue,{size:18})})})]},`${t.variant.id}-${s}`))})]})}),e.jsxs("div",{className:"pos-summary",children:[e.jsxs("div",{className:"pos-summary-row",children:[e.jsxs("span",{children:[e.jsx("b",{children:"Items:"})," ",ve]}),e.jsxs("span",{children:[e.jsx("b",{children:"Subtotal:"})," ",m(R)]})]}),e.jsxs("div",{className:"pos-summary-row",style:{alignItems:"center"},children:[e.jsxs("span",{style:{display:"flex",alignItems:"center",gap:"5px"},children:[e.jsx("b",{children:"Descuento %:"}),e.jsx("input",{type:"number",style:{width:"60px",padding:"2px",border:"1px solid #ccc"},value:k,onChange:t=>N(Number(t.target.value))})]}),e.jsxs("span",{style:{color:"#dd4b39"},children:[e.jsx("b",{children:"(-)"})," ",m(ne+te)]})]})]}),e.jsxs("div",{className:"pos-total-row",children:[e.jsx("span",{children:"Total a Pagar"}),e.jsx("span",{children:m(h)})]}),e.jsxs("div",{className:"pos-action-buttons",children:[e.jsxs("button",{className:"pos-btn bg-draft",disabled:r.length===0,onClick:()=>D.mutate("QUOTATION"),children:[e.jsx(le,{size:20})," Borrador"]}),e.jsxs("button",{className:"pos-btn bg-quotation",disabled:r.length===0,onClick:()=>D.mutate("QUOTATION"),children:[e.jsx(le,{size:20})," Cotización"]}),e.jsxs("button",{className:"pos-btn bg-suspend",disabled:r.length===0,onClick:Ce,children:[e.jsx(xe,{size:20})," Suspender"]}),e.jsxs("button",{className:"pos-btn bg-credit",disabled:r.length===0,onClick:()=>L("CUSTOMER_CREDIT"),children:[e.jsx(pe,{size:20})," Crédito"]}),e.jsxs("button",{className:"pos-btn bg-card",disabled:r.length===0,onClick:()=>L("CREDIT_CARD"),children:[e.jsx(Oe,{size:20})," Tarjeta"]}),e.jsxs("button",{className:"pos-btn bg-multiple",disabled:r.length===0,onClick:()=>L("MULTIPLE"),children:[e.jsx(Ae,{size:20})," Múltiple"]}),e.jsxs("button",{className:"pos-btn bg-cash",disabled:r.length===0,onClick:()=>L("CASH"),children:[e.jsx(Te,{size:24})," Efectivo"]})]})]}),e.jsxs("div",{className:"pos-right",children:[e.jsxs("div",{className:"pos-products-header",children:[e.jsx("select",{style:{flex:1,padding:"8px",border:"1px solid #ccc",borderRadius:"3px"},children:e.jsx("option",{children:"Todas las Categorías"})}),e.jsx("select",{style:{flex:1,padding:"8px",border:"1px solid #ccc",borderRadius:"3px"},children:e.jsx("option",{children:"Todas las Marcas"})})]}),e.jsx("div",{className:"pos-products-grid",children:(re=b.length>=2?q:je)==null?void 0:re.map(t=>e.jsxs("div",{className:"pos-product-card",onClick:()=>ae(t),children:[e.jsx("div",{className:"pos-product-img",children:e.jsx(Qe,{size:32})}),e.jsxs("div",{className:"pos-product-info",children:[e.jsxs("div",{className:"pos-product-name",children:[t.productName||"Producto"," ",t.size?`(${t.size})`:""]}),e.jsx("div",{className:"pos-product-price",children:m(t.basePrice)})]})]},t.id))})]})]}),e.jsx(X,{open:K,onClose:()=>w(!1),title:"Confirmar Pago",children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"20px"},children:[e.jsxs("div",{style:{background:"#00a65a",color:"#fff",padding:"20px",textAlign:"center",borderRadius:"4px"},children:[e.jsx("div",{style:{fontSize:"14px",textTransform:"uppercase"},children:"Monto a Pagar"}),e.jsx("div",{style:{fontSize:"42px",fontWeight:700},children:m(h)})]}),n==="CASH"&&e.jsxs("div",{children:[e.jsx("label",{style:{fontWeight:"bold"},children:"Monto Recibido"}),e.jsx(Me,{type:"number",min:h,value:E,onChange:t=>Q(Number(t.target.value)),style:{fontSize:"24px",padding:"10px"}}),E>h&&e.jsxs("div",{style:{marginTop:"15px",color:"#dd4b39",fontSize:"20px",fontWeight:"bold"},children:["Vuelto: ",m(E-h)]})]}),e.jsx("div",{children:e.jsxs("label",{style:{display:"flex",alignItems:"center",gap:"8px",cursor:"pointer"},children:[e.jsx("input",{type:"checkbox",checked:Z,onChange:t=>ge(t.target.checked)}),"Imprimir Ticket Fiscal AFIP"]})}),e.jsx(U,{variant:"primary",style:{height:"50px",fontSize:"18px",background:"#00a65a",border:"none"},onClick:()=>D.mutate("CONFIRMED"),loading:D.isPending,children:"Completar Venta"})]})}),e.jsx(X,{open:me,onClose:()=>_(!1),title:"Ventas Suspendidas",children:j.length===0?e.jsx("p",{children:"No hay ventas en suspenso."}):e.jsxs("table",{className:"pos-table",style:{border:"1px solid #ddd"},children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{children:"Fecha"}),e.jsx("th",{children:"Cliente"}),e.jsx("th",{children:"Total"}),e.jsx("th",{children:"Acción"})]})}),e.jsx("tbody",{children:j.map(t=>{var s;return e.jsxs("tr",{children:[e.jsx("td",{children:new Date(t.date).toLocaleString()}),e.jsx("td",{children:((s=I==null?void 0:I.data.find(a=>a.id===t.customerId))==null?void 0:s.fullName)||"Consumidor Final"}),e.jsx("td",{style:{fontWeight:"bold"},children:m(t.total)}),e.jsx("td",{children:e.jsx(U,{variant:"primary",style:{padding:"5px 10px",fontSize:"12px"},onClick:()=>ke(t.id),children:"Retomar"})})]},t.id)})})]})}),e.jsx(Fe,{open:F,onClose:()=>A(!1)})]})]})}export{xt as default};
