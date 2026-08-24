import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const SK = "dd_hotdogs_v3";
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const localTime = () => new Date().toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"});
const fmt = (n) => `$${Number(n||0).toLocaleString("es-MX",{minimumFractionDigits:0})}`;
const uid = () => `${Date.now()}${Math.random().toString(36).slice(2,7)}`;

const DEFAULTS = {
  menu:[
    {id:"m1",name:"Hot Dog Clásico",price:45,cat:"Hot Dogs",icon:"🌭"},
    {id:"m2",name:"Hot Dog Especial",price:65,cat:"Hot Dogs",icon:"🌭"},
    {id:"m3",name:"Hot Dog XXL",price:80,cat:"Hot Dogs",icon:"🌭"},
    {id:"m4",name:"Refresco",price:20,cat:"Bebidas",icon:"🥤"},
    {id:"m5",name:"Agua",price:15,cat:"Bebidas",icon:"💧"},
    {id:"m6",name:"Papas fritas",price:25,cat:"Extras",icon:"🍟"},
  ],
  sales:[],
  inventory:[
    {id:"i1",name:"Salchichas",qty:50,unit:"pzas",min:10},
    {id:"i2",name:"Pan hot dog",qty:50,unit:"pzas",min:10},
    {id:"i3",name:"Catsup",qty:3,unit:"botes",min:1},
    {id:"i4",name:"Mostaza",qty:2,unit:"botes",min:1},
    {id:"i5",name:"Mayonesa",qty:2,unit:"botes",min:1},
    {id:"i6",name:"Chile",qty:2,unit:"botes",min:1},
    {id:"i7",name:"Cebolla",qty:5,unit:"pzas",min:2},
  ],
  expenses:[],
};

const ECATS=["Ingredientes","Gas","Transporte","Empaque","Mantenimiento","Otros"];
const MCATS=["Hot Dogs","Bebidas","Extras","Combos"];
const EMOJIS=["🌭","🍔","🍟","🌮","🥤","💧","🧃","🌯","🍕"];
const UNITS=["pzas","kg","g","litros","botes","cajas","bolsas"];
const TABS=[{id:"dash",label:"Inicio",icon:"📊"},{id:"ventas",label:"Ventas",icon:"💰"},{id:"menu",label:"Menú",icon:"🌭"},{id:"inv",label:"Inventario",icon:"📦"},{id:"gastos",label:"Gastos",icon:"💸"}];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#D62828;border-radius:4px;}
body,html{background:#0A0A0A;min-height:100vh;}
.app{font-family:'Nunito',sans-serif;background:#0A0A0A;min-height:100vh;color:#F0EDE8;max-width:480px;margin:0 auto;position:relative;}
.hdr{background:linear-gradient(135deg,#D62828 0%,#A4161A 100%);padding:15px 18px 13px;display:flex;align-items:center;gap:11px;position:sticky;top:0;z-index:100;box-shadow:0 6px 24px rgba(214,40,40,.35);}
.hdr-logo{font-size:26px;line-height:1;}
.hdr-title{font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:2.5px;color:#fff;line-height:1;}
.hdr-sub{font-size:10px;color:rgba(255,255,255,.65);font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-top:1px;}
.hdr-alert{margin-left:auto;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.15);border-radius:20px;padding:4px 11px;font-size:11px;font-weight:800;color:#FFD166;white-space:nowrap;}
.content{padding:14px;padding-bottom:86px;}
.bnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#111;border-top:1px solid #1E1E1E;display:flex;z-index:100;}
.ntab{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:9px 4px 13px;background:none;border:none;cursor:pointer;color:#444;font-family:'Nunito',sans-serif;font-size:10px;font-weight:700;transition:color .18s;letter-spacing:.2px;}
.ntab.on{color:#D62828;}.ntab .ico{font-size:19px;}
.card{background:#141414;border-radius:14px;padding:14px 14px;margin-bottom:11px;border:1px solid #1E1E1E;}
.sgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:11px;}
.scard{background:#141414;border-radius:14px;padding:14px;border:1px solid #1E1E1E;}
.slabel{font-size:10px;color:#555;font-weight:800;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px;}
.sval{font-family:'Bebas Neue',sans-serif;font-size:30px;letter-spacing:1px;line-height:1;}
.stitle{font-family:'Bebas Neue',sans-serif;font-size:17px;letter-spacing:1.5px;color:#FFD166;margin-bottom:11px;}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:10px 18px;border-radius:10px;border:none;cursor:pointer;font-family:'Nunito',sans-serif;font-weight:800;font-size:13px;transition:all .15s;}
.btn-r{background:#D62828;color:#fff;}.btn-r:hover{background:#B01818;}.btn-r:active{transform:scale(.97);}
.btn-y{background:#FFD166;color:#111;}.btn-y:hover{background:#F0C040;}.btn-y:active{transform:scale(.97);}
.btn-sm{padding:7px 13px;font-size:12px;border-radius:9px;}
.btn-fw{width:100%;margin-top:10px;}
.mgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
.mibtn{background:#141414;border:1px solid #1E1E1E;border-radius:13px;padding:14px 10px;cursor:pointer;text-align:center;transition:all .15s;font-family:'Nunito',sans-serif;}
.mibtn:hover{border-color:#D62828;background:#1C1010;transform:scale(1.02);}
.mibtn:active{transform:scale(.97);}
.mi-icon{font-size:28px;margin-bottom:4px;line-height:1;}
.mi-name{font-size:12px;font-weight:700;color:#E8E5E0;margin-bottom:3px;line-height:1.25;}
.mi-price{font-family:'Bebas Neue',sans-serif;font-size:21px;color:#FFD166;}
.ci{display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid #1C1C1C;}
.ci:last-child{border-bottom:none;}
.qctrl{display:flex;align-items:center;gap:5px;background:#1C1C1C;border-radius:8px;padding:2px 4px;}
.qbtn{background:none;border:none;color:#FFD166;font-size:16px;cursor:pointer;padding:2px 7px;font-weight:800;line-height:1;}
.qnum{font-weight:800;font-size:14px;min-width:22px;text-align:center;color:#F0EDE8;}
.inp{background:#1A1A1A;border:1px solid #272727;border-radius:10px;padding:10px 13px;color:#F0EDE8;font-family:'Nunito',sans-serif;font-size:14px;font-weight:600;width:100%;outline:none;transition:border-color .2s;}
.inp:focus{border-color:#D62828;}select.inp{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23555' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px;}
.frow{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.fg{margin-bottom:11px;}
.fl{font-size:10px;font-weight:800;color:#555;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px;display:block;}
.li{display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid #1A1A1A;}
.li:last-child{border-bottom:none;}
.badge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:800;line-height:1.4;}
.br{background:rgba(214,40,40,.18);color:#E87070;}
.by{background:rgba(255,209,102,.18);color:#FFD166;}
.bg{background:rgba(52,199,89,.15);color:#5DD679;}
.delbtn{background:none;border:none;color:#2E2E2E;cursor:pointer;font-size:15px;padding:4px;transition:color .2s;line-height:1;}
.delbtn:hover{color:#D62828;}
.empty{text-align:center;padding:28px 16px;color:#3A3A3A;}
.empty-i{font-size:36px;margin-bottom:8px;}
.empty-t{font-size:13px;font-weight:700;color:#444;}
.shi{display:flex;justify-content:space-between;align-items:flex-start;padding:10px 0;border-bottom:1px solid #1A1A1A;}
.shi:last-child{border-bottom:none;}
.iqctrl{display:flex;align-items:center;gap:6px;}
.iqbtn{width:30px;height:30px;border-radius:9px;border:none;cursor:pointer;font-size:17px;font-weight:800;display:flex;align-items:center;justify-content:center;line-height:1;transition:all .15s;}
.iqm{background:#1E1E1E;color:#E8E5E0;}.iqm:hover{background:#2A2A2A;}
.iqp{background:#D62828;color:#fff;}.iqp:hover{background:#B01818;}
.emsel{display:flex;gap:7px;flex-wrap:wrap;margin-top:2px;}
.emopt{font-size:20px;background:#1A1A1A;border:1.5px solid #242424;border-radius:9px;padding:5px 8px;cursor:pointer;transition:all .15s;line-height:1;}
.emopt.sel{background:rgba(214,40,40,.2);border-color:#D62828;}
.price-edit-btn{background:none;border:none;cursor:pointer;font-size:11px;color:#555;padding:1px 4px;border-radius:4px;transition:color .15s;line-height:1;margin-left:2px;}
.price-edit-btn:hover{color:#FFD166;}
.price-inp-overlay{background:#1A1A1A;border:2px solid #D62828;border-radius:9px;padding:5px 7px;color:#FFD166;font-family:'Bebas Neue',sans-serif;font-size:22px;width:100%;outline:none;text-align:center;letter-spacing:1px;}

.toast{position:fixed;top:76px;left:50%;transform:translateX(-50%) translateY(0);background:#34C759;color:#0A3A18;padding:9px 22px;border-radius:30px;font-weight:800;font-size:13px;z-index:999;white-space:nowrap;animation:fout 2.6s forwards;pointer-events:none;}
@keyframes fout{0%,60%{opacity:1;transform:translateX(-50%) translateY(0);}100%{opacity:0;transform:translateX(-50%) translateY(-10px);}}
.divider{border-top:1.5px solid #D62828;margin-top:10px;padding-top:12px;display:flex;justify-content:space-between;align-items:center;}
.cat-label{font-size:10px;font-weight:800;color:#444;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;}
`;

export default function App() {
  const [tab, setTab] = useState("dash");
  const [data, setData] = useState(null);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState(null);
  const [menuForm, setMenuForm] = useState({name:"",price:"",cat:"Hot Dogs",icon:"🌭"});
  const [showMF, setShowMF] = useState(false);
  const [expForm, setExpForm] = useState({desc:"",amount:"",cat:"Ingredientes"});
  const [invForm, setInvForm] = useState({name:"",qty:"",unit:"pzas",min:"5"});
  const [showIF, setShowIF] = useState(false);
  const [editingPrice, setEditingPrice] = useState({id:null,value:""});

  useEffect(()=>{
    (async()=>{
      try{const r=await window.storage.get(SK);setData(r?JSON.parse(r.value):DEFAULTS);}
      catch{setData(DEFAULTS);}
    })();
  },[]);

  useEffect(()=>{
    if(!data)return;
    window.storage.set(SK,JSON.stringify(data)).catch(console.error);
  },[data]);

  const upd=(patch)=>setData(d=>({...d,...patch}));
  const pop=(msg)=>{setToast(msg);setTimeout(()=>setToast(null),2700);};

  const addToCart=(item)=>setCart(c=>{const ex=c.find(x=>x.id===item.id);return ex?c.map(x=>x.id===item.id?{...x,qty:x.qty+1}:x):[...c,{...item,qty:1}];});
  const chQty=(id,d)=>setCart(c=>c.map(x=>x.id===id?{...x,qty:Math.max(1,x.qty+d)}:x));
  const remCart=(id)=>setCart(c=>c.filter(x=>x.id!==id));
  const cartTotal=cart.reduce((s,x)=>s+x.price*x.qty,0);

  const doSale=()=>{
    if(!cart.length)return;
    const s={id:uid(),date:localDate(),time:localTime(),items:[...cart],total:cartTotal};
    upd({sales:[s,...data.sales]});
    setCart([]);
    pop(`✅ Venta de ${fmt(cartTotal)} registrada`);
  };

  if(!data) return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:"#0A0A0A",color:"#FFD166",fontFamily:"sans-serif",gap:14}}>
      <div style={{fontSize:56}}>🌭</div>
      <div style={{fontSize:16,fontWeight:700,letterSpacing:1}}>Cargando DD Hot Dogs...</div>
    </div>
  );

  const TODAY=localDate();
  const todaySales=data.sales.filter(s=>s.date===TODAY);
  const todayRev=todaySales.reduce((s,x)=>s+x.total,0);
  const todayExp=data.expenses.filter(e=>e.date===TODAY).reduce((s,x)=>s+Number(x.amount),0);
  const todayProfit=todayRev-todayExp;
  const lowStock=data.inventory.filter(i=>Number(i.qty)<=Number(i.min));

  const chartData=Array.from({length:7},(_,i)=>{
    const d=new Date();d.setDate(d.getDate()-(6-i));
    const ds=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const label=d.toLocaleDateString("es-MX",{weekday:"short"}).replace(".","").slice(0,3);
    const total=data.sales.filter(s=>s.date===ds).reduce((s,x)=>s+x.total,0);
    return{day:label,total};
  });

  const prodCounts={};
  data.sales.forEach(s=>s.items.forEach(item=>{prodCounts[item.name]=(prodCounts[item.name]||0)+item.qty;}));
  const topProds=Object.entries(prodCounts).sort((a,b)=>b[1]-a[1]).slice(0,3);

  function dashView(){
    return(
      <div>
        <div style={{marginBottom:14}}>
          <div className="stitle" style={{marginBottom:2}}>Resumen de Hoy</div>
          <div style={{fontSize:12,color:"#454545",fontWeight:600}}>
            {new Date().toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"})}
          </div>
        </div>
        <div className="sgrid">
          <div className="scard">
            <div className="slabel">💰 Ventas</div>
            <div className="sval" style={{color:"#FFD166"}}>{fmt(todayRev)}</div>
            <div style={{fontSize:11,color:"#3A3A3A",marginTop:3}}>{todaySales.length} pedido{todaySales.length!==1?"s":""}</div>
          </div>
          <div className="scard">
            <div className="slabel">💸 Gastos</div>
            <div className="sval" style={{color:"#E87070"}}>{fmt(todayExp)}</div>
          </div>
          <div className="scard" style={{gridColumn:"1/-1",background:todayProfit>=0?"rgba(52,199,89,.06)":"rgba(214,40,40,.06)",borderColor:todayProfit>=0?"rgba(52,199,89,.2)":"rgba(214,40,40,.2)"}}>
            <div className="slabel">📈 Ganancia Neta</div>
            <div className="sval" style={{color:todayProfit>=0?"#5DD679":"#E87070",fontSize:40}}>{fmt(todayProfit)}</div>
          </div>
        </div>
        <div className="card">
          <div className="stitle">Ventas — Últimos 7 Días</div>
          <ResponsiveContainer width="100%" height={148}>
            <BarChart data={chartData} margin={{top:0,right:0,left:-28,bottom:0}}>
              <XAxis dataKey="day" tick={{fill:"#555",fontSize:11,fontFamily:"Nunito,sans-serif",fontWeight:700}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:"#3A3A3A",fontSize:10}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:"#1A1A1A",border:"1px solid #272727",borderRadius:10,color:"#F0EDE8",fontFamily:"Nunito,sans-serif",fontSize:12,padding:"7px 12px"}} formatter={v=>[fmt(v),"Ventas"]} cursor={{fill:"rgba(255,255,255,.03)"}}/>
              <Bar dataKey="total" fill="#D62828" radius={[7,7,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {topProds.length>0&&(
          <div className="card">
            <div className="stitle">🏆 Top Productos</div>
            {topProds.map(([name,count],i)=>(
              <div key={name} className="li">
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:22,color:["#FFD166","#AAAAAA","#CD7F32"][i],minWidth:20,lineHeight:1}}>{i+1}</div>
                  <div style={{fontWeight:700,fontSize:14}}>{name}</div>
                </div>
                <span className="badge by">{count} vendidos</span>
              </div>
            ))}
          </div>
        )}
        {lowStock.length>0&&(
          <div className="card" style={{borderColor:"rgba(214,40,40,.3)",background:"rgba(214,40,40,.05)"}}>
            <div style={{fontWeight:800,color:"#E87070",marginBottom:8,fontSize:13}}>⚠️ Stock Bajo</div>
            {lowStock.map(item=>(
              <div key={item.id} className="li" style={{padding:"8px 0"}}>
                <span style={{fontWeight:700,fontSize:13}}>{item.name}</span>
                <span className="badge br">{item.qty} {item.unit}</span>
              </div>
            ))}
          </div>
        )}
        {data.sales.length===0&&data.expenses.length===0&&(
          <div className="empty" style={{marginTop:20}}>
            <div className="empty-i">🌭</div>
            <div className="empty-t">¡Bienvenido a DD Hot Dogs!</div>
            <div style={{fontSize:12,marginTop:6,color:"#2E2E2E"}}>Ve a Ventas para registrar tu primer pedido</div>
          </div>
        )}
      </div>
    );
  }

  function ventasView(){
    return(
      <div>
        <div className="stitle">Registrar Venta</div>
        {data.menu.length===0?(
          <div className="empty"><div className="empty-i">🌭</div><div className="empty-t">Agrega productos en la pestaña Menú primero</div></div>
        ):(
          <div className="mgrid">
            {data.menu.map(item=>{
              const isEditing=editingPrice.id===item.id;
              const savePrice=()=>{
                const p=Number(editingPrice.value);
                if(p>0)upd({menu:data.menu.map(m=>m.id===item.id?{...m,price:p}:m)});
                setEditingPrice({id:null,value:""});
              };
              return(
                <div key={item.id} style={{position:"relative"}}>
                  <button className="mibtn" style={{width:"100%",opacity:isEditing?.6:1}} onClick={()=>{if(!isEditing)addToCart(item);}}>
                    <div className="mi-icon">{item.icon}</div>
                    <div className="mi-name">{item.name}</div>
                    {isEditing?(
                      <input
                        className="price-inp-overlay"
                        type="number"
                        value={editingPrice.value}
                        autoFocus
                        onClick={e=>e.stopPropagation()}
                        onChange={e=>setEditingPrice(v=>({...v,value:e.target.value}))}
                        onBlur={savePrice}
                        onKeyDown={e=>{if(e.key==="Enter")savePrice();if(e.key==="Escape")setEditingPrice({id:null,value:""});}}
                      />
                    ):(
                      <div className="mi-price">{fmt(item.price)}</div>
                    )}
                  </button>
                  {!isEditing&&(
                    <button
                      className="price-edit-btn"
                      title="Editar precio"
                      style={{position:"absolute",top:6,right:6}}
                      onClick={e=>{e.stopPropagation();setEditingPrice({id:item.id,value:String(item.price)});}}
                    >✏️</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="card">
          <div className="stitle" style={{marginBottom:8}}>🛒 Pedido</div>
          {cart.length===0?(
            <div className="empty" style={{padding:"16px 0"}}>
              <div className="empty-i" style={{fontSize:28}}>🛒</div>
              <div className="empty-t">Toca un producto para agregarlo</div>
            </div>
          ):(
            <>
              {cart.map(item=>(
                <div key={item.id} className="ci">
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13}}>{item.icon} {item.name}</div>
                    <div style={{fontSize:11,color:"#444"}}>{fmt(item.price)} c/u</div>
                  </div>
                  <div className="qctrl">
                    <button className="qbtn" onClick={()=>chQty(item.id,-1)}>−</button>
                    <span className="qnum">{item.qty}</span>
                    <button className="qbtn" onClick={()=>chQty(item.id,1)}>+</button>
                  </div>
                  <div style={{minWidth:58,textAlign:"right",fontFamily:"Bebas Neue,sans-serif",fontSize:19,color:"#FFD166",marginLeft:8}}>{fmt(item.price*item.qty)}</div>
                  <button className="delbtn" onClick={()=>remCart(item.id)} style={{marginLeft:4}}>✕</button>
                </div>
              ))}
              <div className="divider">
                <div style={{fontWeight:800,fontSize:14,letterSpacing:.5}}>TOTAL</div>
                <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:36,color:"#FFD166",lineHeight:1}}>{fmt(cartTotal)}</div>
              </div>
              <button className="btn btn-r btn-fw" onClick={doSale}>✅ Registrar Venta</button>
            </>
          )}
        </div>
        {todaySales.length>0&&(
          <div className="card">
            <div className="stitle">Ventas de Hoy ({todaySales.length})</div>
            {todaySales.slice(0,15).map(sale=>(
              <div key={sale.id} className="shi">
                <div style={{flex:1,marginRight:10}}>
                  <div style={{fontWeight:700,fontSize:12,lineHeight:1.4,color:"#CCC"}}>{sale.items.map(i=>`${i.qty}× ${i.name}`).join(", ")}</div>
                  <div style={{fontSize:10,color:"#3A3A3A",marginTop:3}}>{sale.time}</div>
                </div>
                <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:20,color:"#5DD679",whiteSpace:"nowrap"}}>{fmt(sale.total)}</div>
              </div>
            ))}
            <div style={{borderTop:"1px solid #1C1C1C",marginTop:8,paddingTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{color:"#444",fontSize:12,fontWeight:700}}>TOTAL DEL DÍA</span>
              <span style={{fontFamily:"Bebas Neue,sans-serif",fontSize:22,color:"#FFD166"}}>{fmt(todayRev)}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  function menuView(){
    const addItem=()=>{
      if(!menuForm.name||!menuForm.price)return;
      upd({menu:[...data.menu,{id:uid(),name:menuForm.name,price:Number(menuForm.price),cat:menuForm.cat,icon:menuForm.icon}]});
      setMenuForm({name:"",price:"",cat:"Hot Dogs",icon:"🌭"});
      setShowMF(false);pop("✅ Producto agregado");
    };
    const delItem=(id)=>upd({menu:data.menu.filter(m=>m.id!==id)});
    return(
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div className="stitle" style={{marginBottom:0}}>Menú ({data.menu.length})</div>
          <button className="btn btn-r btn-sm" onClick={()=>setShowMF(!showMF)}>{showMF?"✕ Cancelar":"+ Agregar"}</button>
        </div>
        {showMF&&(
          <div className="card" style={{marginBottom:12,borderColor:"rgba(214,40,40,.3)"}}>
            <div className="stitle" style={{marginBottom:12,fontSize:15}}>Nuevo Producto</div>
            <div className="fg">
              <label className="fl">Ícono</label>
              <div className="emsel">
                {EMOJIS.map(e=><button key={e} className={`emopt ${menuForm.icon===e?"sel":""}`} onClick={()=>setMenuForm(f=>({...f,icon:e}))}>{e}</button>)}
              </div>
            </div>
            <div className="fg">
              <label className="fl">Nombre del producto</label>
              <input className="inp" placeholder="Ej: Hot Dog Sonora" value={menuForm.name} onChange={e=>setMenuForm(f=>({...f,name:e.target.value}))}/>
            </div>
            <div className="frow">
              <div className="fg">
                <label className="fl">Precio ($)</label>
                <input className="inp" type="number" placeholder="0" value={menuForm.price} onChange={e=>setMenuForm(f=>({...f,price:e.target.value}))}/>
              </div>
              <div className="fg">
                <label className="fl">Categoría</label>
                <select className="inp" value={menuForm.cat} onChange={e=>setMenuForm(f=>({...f,cat:e.target.value}))}>
                  {MCATS.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button className="btn btn-y btn-fw" onClick={addItem}>Guardar Producto</button>
          </div>
        )}
        {MCATS.map(cat=>{
          const items=data.menu.filter(m=>m.cat===cat);
          if(!items.length)return null;
          return(
            <div key={cat} className="card">
              <div className="cat-label">{cat}</div>
              {items.map(item=>(
                <div key={item.id} className="li">
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:22,lineHeight:1}}>{item.icon}</span>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{item.name}</div>
                      <div style={{fontFamily:"Bebas Neue,sans-serif",fontSize:19,color:"#FFD166",lineHeight:1.2}}>{fmt(item.price)}</div>
                    </div>
                  </div>
                  <button className="delbtn" onClick={()=>delItem(item.id)} title="Eliminar">🗑️</button>
                </div>
              ))}
            </div>
          );
        })}
        {data.menu.length===0&&<div className="empty"><div className="empty-i">🌭</div><div className="empty-t">Sin productos. ¡Agrega uno!</div></div>}
      </div>
    );
  }

  function invView(){
    const addInv=()=>{
      if(!invForm.name||!invForm.qty)return;
      upd({inventory:[...data.inventory,{id:uid(),name:invForm.name,qty:Number(invForm.qty),unit:invForm.unit,min:Number(invForm.min)||0}]});
      setInvForm({name:"",qty:"",unit:"pzas",min:"5"});setShowIF(false);pop("✅ Ingrediente agregado");
    };
    const updateQty=(id,d)=>upd({inventory:data.inventory.map(i=>i.id===id?{...i,qty:Math.max(0,Number(i.qty)+d)}:i)});
    const setQtyDirect=(id,val)=>upd({inventory:data.inventory.map(i=>i.id===id?{...i,qty:Math.max(0,Number(val)||0)}:i)});
    const delInv=(id)=>upd({inventory:data.inventory.filter(i=>i.id!==id)});
    return(
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div className="stitle" style={{marginBottom:0}}>Inventario</div>
          <button className="btn btn-r btn-sm" onClick={()=>setShowIF(!showIF)}>{showIF?"✕ Cancelar":"+ Agregar"}</button>
        </div>
        {lowStock.length>0&&(
          <div style={{background:"rgba(214,40,40,.1)",border:"1px solid rgba(214,40,40,.28)",borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:13,fontWeight:700,color:"#E87070"}}>
            ⚠️ {lowStock.length} ingrediente{lowStock.length!==1?"s":""} bajo en stock
          </div>
        )}
        {showIF&&(
          <div className="card" style={{marginBottom:12,borderColor:"rgba(214,40,40,.3)"}}>
            <div className="stitle" style={{marginBottom:12,fontSize:15}}>Nuevo Ingrediente</div>
            <div className="fg">
              <label className="fl">Nombre</label>
              <input className="inp" placeholder="Ej: Salchichas" value={invForm.name} onChange={e=>setInvForm(f=>({...f,name:e.target.value}))}/>
            </div>
            <div className="frow">
              <div className="fg">
                <label className="fl">Cantidad</label>
                <input className="inp" type="number" placeholder="0" value={invForm.qty} onChange={e=>setInvForm(f=>({...f,qty:e.target.value}))}/>
              </div>
              <div className="fg">
                <label className="fl">Unidad</label>
                <select className="inp" value={invForm.unit} onChange={e=>setInvForm(f=>({...f,unit:e.target.value}))}>
                  {UNITS.map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="fg">
              <label className="fl">Mínimo (alerta)</label>
              <input className="inp" type="number" placeholder="0" value={invForm.min} onChange={e=>setInvForm(f=>({...f,min:e.target.value}))}/>
            </div>
            <button className="btn btn-y btn-fw" onClick={addInv}>Guardar Ingrediente</button>
          </div>
        )}
        <div className="card">
          {data.inventory.length===0?(
            <div className="empty"><div className="empty-i">📦</div><div className="empty-t">Sin ingredientes registrados</div></div>
          ):data.inventory.map(item=>{
            const isLow=Number(item.qty)<=Number(item.min);
            return(
              <div key={item.id} className="li">
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    {item.name}
                    {isLow&&<span className="badge br">⚠ Bajo</span>}
                  </div>
                  <div style={{fontSize:10,color:"#3A3A3A",marginTop:2}}>Mín: {item.min} {item.unit}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <div className="iqctrl">
                    <button className="iqbtn iqm" onClick={()=>updateQty(item.id,-1)}>−</button>
                    <span style={{fontFamily:"Bebas Neue,sans-serif",fontSize:20,minWidth:52,textAlign:"center",color:isLow?"#E87070":"#F0EDE8",lineHeight:1}}>
                      {item.qty}<span style={{fontSize:9,fontFamily:"Nunito,sans-serif",color:"#444",marginLeft:2}}>{item.unit}</span>
                    </span>
                    <button className="iqbtn iqp" onClick={()=>updateQty(item.id,1)}>+</button>
                  </div>
                  <button className="delbtn" onClick={()=>delInv(item.id)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function gastosView(){
    const addExp=()=>{
      if(!expForm.desc||!expForm.amount)return;
      const exp={id:uid(),date:localDate(),time:localTime(),desc:expForm.desc,amount:Number(expForm.amount),cat:expForm.cat};
      upd({expenses:[exp,...data.expenses]});
      setExpForm({desc:"",amount:"",cat:"Ingredientes"});pop("✅ Gasto registrado");
    };
    const delExp=(id)=>upd({expenses:data.expenses.filter(e=>e.id!==id)});
    const monthStr=`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}`;
    const monthExp=data.expenses.filter(e=>e.date.startsWith(monthStr)).reduce((s,x)=>s+Number(x.amount),0);
    return(
      <div>
        <div className="sgrid" style={{marginBottom:12}}>
          <div className="scard">
            <div className="slabel">💸 Hoy</div>
            <div className="sval" style={{color:"#E87070",fontSize:24}}>{fmt(todayExp)}</div>
          </div>
          <div className="scard">
            <div className="slabel">📅 Este Mes</div>
            <div className="sval" style={{color:"#E87070",fontSize:24}}>{fmt(monthExp)}</div>
          </div>
        </div>
        <div className="card">
          <div className="stitle" style={{marginBottom:12,fontSize:15}}>Registrar Gasto</div>
          <div className="fg">
            <label className="fl">Descripción</label>
            <input className="inp" placeholder="Ej: Compra de salchichas" value={expForm.desc} onChange={e=>setExpForm(f=>({...f,desc:e.target.value}))}/>
          </div>
          <div className="frow">
            <div className="fg">
              <label className="fl">Monto ($)</label>
              <input className="inp" type="number" placeholder="0" value={expForm.amount} onChange={e=>setExpForm(f=>({...f,amount:e.target.value}))}/>
            </div>
            <div className="fg">
              <label className="fl">Categoría</label>
              <select className="inp" value={expForm.cat} onChange={e=>setExpForm(f=>({...f,cat:e.target.value}))}>
                {ECATS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-r btn-fw" onClick={addExp}>Registrar Gasto</button>
        </div>
        {data.expenses.length>0?(
          <div className="card" style={{marginTop:0}}>
            <div className="stitle">Historial ({data.expenses.length})</div>
            {data.expenses.slice(0,40).map(exp=>(
              <div key={exp.id} className="li">
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13}}>{exp.desc}</div>
                  <div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap",alignItems:"center"}}>
                    <span className="badge by">{exp.cat}</span>
                    <span style={{fontSize:10,color:"#3A3A3A"}}>{exp.date} · {exp.time}</span>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginLeft:10,flexShrink:0}}>
                  <span style={{fontFamily:"Bebas Neue,sans-serif",fontSize:20,color:"#E87070"}}>{fmt(exp.amount)}</span>
                  <button className="delbtn" onClick={()=>delExp(exp.id)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        ):(
          <div className="empty" style={{marginTop:24}}>
            <div className="empty-i">💸</div>
            <div className="empty-t">Sin gastos registrados</div>
          </div>
        )}
      </div>
    );
  }

  return(
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="hdr">
          <div className="hdr-logo">🌭</div>
          <div>
            <div className="hdr-title">DD Hot Dogs</div>
            <div className="hdr-sub">Administración</div>
          </div>
          {lowStock.length>0&&<div className="hdr-alert">⚠️ {lowStock.length} bajo stock</div>}
        </div>
        <div className="content">
          {tab==="dash"&&dashView()}
          {tab==="ventas"&&ventasView()}
          {tab==="menu"&&menuView()}
          {tab==="inv"&&invView()}
          {tab==="gastos"&&gastosView()}
        </div>
        <nav className="bnav">
          {TABS.map(t=>(
            <button key={t.id} className={`ntab ${tab===t.id?"on":""}`} onClick={()=>setTab(t.id)}>
              <span className="ico">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        {toast&&<div className="toast">{toast}</div>}
      </div>
    </>
  );
}
