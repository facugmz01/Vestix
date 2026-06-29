import{r as o,u as S,a as C,b as F,j as i,A as f,z as L,c as M}from"./index-C54oyxG-.js";import{u as A}from"./useMutation-DnSzrbyL.js";import{C as g}from"./circle-alert-OHG5Un7z.js";import{M as I}from"./mail-CPZ503Jv.js";import{L as P}from"./lock-yAR2fspX.js";import{E as $}from"./eye-off-C7uo4Wna.js";import{E as O}from"./eye-kf0hLhVP.js";function R(){var c;const[t,m]=o.useState(""),[s,u]=o.useState(""),[l,h]=o.useState(!1),[a,r]=o.useState({}),[p,w]=o.useState(!1),j=S(e=>e.setAuth),v=C(),k=((c=F().state)==null?void 0:c.from)??"/admin";o.useEffect(()=>{w(!0)},[]);const{mutate:y,isPending:d,isError:z}=A({mutationFn:()=>M.login({email:t.trim(),password:s}),onSuccess:({user:e})=>{j(e);const n=e.fullName?e.fullName.split(" ")[0]:e.email.split("@")[0];L.success(`¡Bienvenido, ${n}!`),v(k,{replace:!0})},onError:e=>{var b,x;const n=((x=(b=e==null?void 0:e.response)==null?void 0:b.data)==null?void 0:x.message)??"";n.toLowerCase().includes("password")||n.toLowerCase().includes("credential")?r({password:"Contraseña incorrecta."}):(n.toLowerCase().includes("email")||n.toLowerCase().includes("user"))&&r({email:"Email no registrado."})}});o.useEffect(()=>{r(e=>({...e,email:void 0}))},[t]),o.useEffect(()=>{r(e=>({...e,password:void 0}))},[s]);const N=()=>{const e={};return t.trim()?/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)||(e.email="Email inválido."):e.email="El email es requerido.",s||(e.password="La contraseña es requerida."),r(e),Object.keys(e).length===0},E=e=>{e.preventDefault(),N()&&y()};return i.jsxs(i.Fragment,{children:[i.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        #login-root-page {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', system-ui, sans-serif;
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
          background: #0f0c29;
        }

        /* Animated gradient background */
        #login-bg-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            #0f0c29 0%,
            #302b63 50%,
            #24243e 100%
          );
          animation: bgShift 12s ease-in-out infinite alternate;
        }

        @keyframes bgShift {
          0%   { background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%); }
          50%  { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); }
          100% { background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #1a0533 100%); }
        }

        /* Floating orbs */
        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          animation: orbFloat 18s ease-in-out infinite alternate;
        }

        .login-orb-1 {
          width: 500px; height: 500px;
          background: rgba(120, 40, 200, 0.45);
          top: -15%; left: -10%;
          animation-duration: 22s;
        }

        .login-orb-2 {
          width: 400px; height: 400px;
          background: rgba(0, 150, 255, 0.3);
          bottom: -15%; right: -10%;
          animation-delay: -8s;
          animation-duration: 18s;
        }

        .login-orb-3 {
          width: 300px; height: 300px;
          background: rgba(255, 80, 150, 0.2);
          top: 50%; left: 60%;
          animation-delay: -4s;
          animation-duration: 25s;
        }

        @keyframes orbFloat {
          0%   { transform: translate(0, 0) scale(1); }
          33%  { transform: translate(4%, 8%) scale(1.08); }
          66%  { transform: translate(-4%, 4%) scale(0.94); }
          100% { transform: translate(2%, -6%) scale(1.04); }
        }

        /* Subtle grid overlay */
        #login-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        /* Card */
        #login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          margin: 16px;
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(40px) saturate(180%);
          -webkit-backdrop-filter: blur(40px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          padding: 48px 40px;
          box-shadow:
            0 32px 80px rgba(0, 0, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            0 0 0 1px rgba(255,255,255,0.04);
          transform: ${p?"translateY(0) scale(1)":"translateY(32px) scale(0.96)"};
          opacity: ${p?"1":"0"};
          transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.7s ease;
        }

        /* Logo area */
        #login-logo-row {
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: center;
          margin-bottom: 36px;
        }

        #login-logo-mark {
          width: 46px; height: 46px;
          border-radius: 14px;
          background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%);
          box-shadow: 0 8px 32px rgba(99, 60, 237, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #login-logo-mark svg {
          width: 24px; height: 24px;
          fill: white;
        }

        #login-brand-name {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #ffffff;
        }

        /* Heading */
        #login-heading {
          text-align: center;
          margin-bottom: 32px;
        }

        #login-title {
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -0.04em;
          color: #ffffff;
          margin: 0 0 8px;
          line-height: 1.1;
        }

        #login-subtitle {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.45);
          margin: 0;
          font-weight: 400;
        }

        /* Error banner */
        #login-error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 14px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #fca5a5;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 24px;
          animation: loginShake 0.4s ease;
        }

        @keyframes loginShake {
          0%, 100% { transform: translateX(0); }
          20%, 60%  { transform: translateX(-5px); }
          40%, 80%  { transform: translateX(5px); }
        }

        /* Fields */
        #login-fields {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 28px;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .login-label {
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.65);
          letter-spacing: 0.01em;
        }

        .login-input-row {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 16px;
          color: rgba(255,255,255,0.35);
          display: flex;
          align-items: center;
          pointer-events: none;
          transition: color 0.2s;
        }

        .login-input-eye {
          position: absolute;
          right: 14px;
          color: rgba(255,255,255,0.35);
          display: flex;
          align-items: center;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: color 0.2s;
        }
        .login-input-eye:hover { color: rgba(255,255,255,0.7); }

        .login-input {
          width: 100%;
          padding: 14px 16px 14px 46px;
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          color: #ffffff;
          font-size: 15px;
          font-family: 'Inter', system-ui, sans-serif;
          outline: none;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
          -webkit-autofill: unset;
        }

        .login-input::placeholder {
          color: rgba(255,255,255,0.25);
        }

        .login-input:focus {
          border-color: rgba(124, 58, 237, 0.6);
          background: rgba(124, 58, 237, 0.08);
          box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15);
        }

        .login-input-row:focus-within .login-input-icon {
          color: rgba(124, 58, 237, 0.8);
        }

        .login-input.has-error {
          border-color: rgba(239, 68, 68, 0.5);
          background: rgba(239, 68, 68, 0.06);
        }

        .login-input.has-error:focus {
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12);
        }

        .login-input-pass { padding-right: 48px; }

        .login-field-error {
          font-size: 12px;
          color: #fca5a5;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        /* Submit button */
        #login-submit {
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #2563eb 100%);
          color: #ffffff;
          font-size: 16px;
          font-weight: 700;
          font-family: 'Inter', system-ui, sans-serif;
          cursor: pointer;
          letter-spacing: -0.01em;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, opacity 0.2s;
          box-shadow: 0 8px 32px rgba(99, 60, 237, 0.45);
          position: relative;
          overflow: hidden;
        }

        #login-submit::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
        }

        #login-submit:not(:disabled):hover {
          transform: translateY(-2px) scale(1.01);
          box-shadow: 0 16px 48px rgba(99, 60, 237, 0.55);
        }

        #login-submit:not(:disabled):active {
          transform: translateY(0) scale(0.99);
          box-shadow: 0 4px 16px rgba(99, 60, 237, 0.4);
        }

        #login-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: loginSpin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }

        @keyframes loginSpin { to { transform: rotate(360deg); } }

        /* Footer */
        #login-footer {
          text-align: center;
          margin-top: 28px;
          font-size: 12px;
          color: rgba(255,255,255,0.2);
          font-weight: 500;
        }

        /* Chrome autofill override */
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:hover,
        .login-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px rgba(15, 12, 41, 0.8) inset !important;
          -webkit-text-fill-color: #ffffff !important;
          border-color: rgba(124, 58, 237, 0.6) !important;
          caret-color: white !important;
        }

        /* Mobile */
        @media (max-width: 480px) {
          #login-card {
            padding: 36px 24px;
            border-radius: 24px;
            margin: 12px;
          }
          #login-title { font-size: 26px; }
          #login-submit { padding: 15px; font-size: 15px; }
        }
      `}),i.jsxs("div",{id:"login-root-page",children:[i.jsx("div",{id:"login-bg-gradient"}),i.jsx("div",{id:"login-grid"}),i.jsx("div",{className:"login-orb login-orb-1"}),i.jsx("div",{className:"login-orb login-orb-2"}),i.jsx("div",{className:"login-orb login-orb-3"}),i.jsxs("div",{id:"login-card",children:[i.jsxs("div",{id:"login-logo-row",children:[i.jsx("div",{id:"login-logo-mark",children:i.jsx("svg",{viewBox:"0 0 24 24",xmlns:"http://www.w3.org/2000/svg",children:i.jsx("path",{d:"M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"})})}),i.jsx("span",{id:"login-brand-name",children:f.appName})]}),i.jsxs("div",{id:"login-heading",children:[i.jsx("h1",{id:"login-title",children:"Iniciar sesión"}),i.jsx("p",{id:"login-subtitle",children:"Ingresá tus credenciales para continuar"})]}),z&&!Object.keys(a).length&&i.jsxs("div",{id:"login-error-banner",children:[i.jsx(g,{size:16}),i.jsx("span",{children:"Email o contraseña incorrectos."})]}),i.jsxs("form",{onSubmit:E,noValidate:!0,children:[i.jsxs("div",{id:"login-fields",children:[i.jsxs("div",{className:"login-field",children:[i.jsx("label",{className:"login-label",htmlFor:"login-email",children:"Email"}),i.jsxs("div",{className:"login-input-row",children:[i.jsx("span",{className:"login-input-icon",children:i.jsx(I,{size:16})}),i.jsx("input",{id:"login-email",className:`login-input${a.email?" has-error":""}`,type:"email",placeholder:"admin@tienda.com",value:t,onChange:e=>m(e.target.value),autoComplete:"email",autoFocus:!0})]}),a.email&&i.jsxs("span",{className:"login-field-error",children:[i.jsx(g,{size:12}),a.email]})]}),i.jsxs("div",{className:"login-field",children:[i.jsx("label",{className:"login-label",htmlFor:"login-password",children:"Contraseña"}),i.jsxs("div",{className:"login-input-row",children:[i.jsx("span",{className:"login-input-icon",children:i.jsx(P,{size:16})}),i.jsx("input",{id:"login-password",className:`login-input login-input-pass${a.password?" has-error":""}`,type:l?"text":"password",placeholder:"••••••••",value:s,onChange:e=>u(e.target.value),autoComplete:"current-password"}),i.jsx("button",{type:"button",className:"login-input-eye",onClick:()=>h(e=>!e),"aria-label":l?"Ocultar contraseña":"Mostrar contraseña",children:l?i.jsx($,{size:16}):i.jsx(O,{size:16})})]}),a.password&&i.jsxs("span",{className:"login-field-error",children:[i.jsx(g,{size:12}),a.password]})]})]}),i.jsxs("button",{id:"login-submit",type:"submit",disabled:d,children:[d&&i.jsx("span",{className:"login-spinner"}),d?"Verificando…":"Ingresar"]})]}),i.jsxs("div",{id:"login-footer",children:["v",f.appVersion]})]})]})]})}export{R as default};
