// Render actual local CRM source with invented fixtures. No external request is allowed through.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const app=path.resolve(here,'../../automanize-app/inmuebles');
const {chromium}=await import(pathToFileURL(path.join(app,'node_modules/playwright/index.mjs')).href);
const {createServer}=await import(pathToFileURL(path.join(app,'node_modules/vite/dist/node/index.js')).href);
const OUT=path.resolve(here,'../assets/images/crm-20261028');
fs.mkdirSync(OUT,{recursive:true});
const TENANT_ID = '00000000-0000-0000-0000-0000000000aa';
const USER_ID = '00000000-0000-0000-0000-0000000000bb';
const n = (i) => String(i).padStart(2, '0');

const tenant = { id: TENANT_ID, nombre: 'Brisa Gestión Inmobiliaria', plan: 'gratis', pagado: false, activo: true, trial_bloqueado: false, trial_ends_at: null, email_contacto: 'equipo@brisa.example.com', telefono_contacto: '34600111222', factura_config: {}, paneles_ocultos: [] };
const perfil = { user_id: USER_ID, email: 'equipo@brisa.example.com', nombre: 'Clara Montes', rol: 'admin', tenant_id: TENANT_ID, vista_propietario: 'basic', propietario_id: null, gestor_id: null, notificaciones_config: {} };

const pisos = Array.from({ length: 6 }, (_, i) => ({ id_inmueble: `PISO-${n(i)}`, nombre: `Calle Muy Larga Del Ejemplo ${i}, 3ºB`, direccion_completa: `Calle Muy Larga Del Ejemplo Numero ${i}, Portal 2, 3ºB, 30001 Murcia`, zona: 'Centro Historico', localidad: 'Murcia', precio: 850 + i * 10, alquiler: 700, suministros: 150, estado: i % 2 ? 'alquilada' : 'disponible', solo_referencia: false, propietario_id: 'p1', tenant_id: TENANT_ID, habitaciones_totales: 3, habitaciones_disponibles: 1, created_at: '2026-01-01T00:00:00Z' }));
const habitaciones = Array.from({ length: 12 }, (_, i) => ({ id_inmueble: `HAB-${n(i)}`, piso_id: `PISO-${n(i % 6)}`, nombre: `Habitacion ${i} exterior con balcon grande`, zona: 'Centro Historico', tipo_unidad: 'Individual simple', precio: 400 + i, alquiler: 350, suministros: 50, estado: i % 3 ? 'alquilada' : 'disponible', propietario_id: 'p1', tenant_id: TENANT_ID, created_at: '2026-01-01T00:00:00Z' }));
const clientes = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, nombre: `Interesado Nombre Apellido Largo ${i}`, telefono: 34600000000 + i, prefijo: '34', email: `interesado.numero.${i}@correolargodeejemplo.com`, zona: 'Centro Historico', presupuesto_max: 600, tipo_habitacion: 'Individual', seguimiento: ['Nuevo', 'Contactado', 'Pisos enviados', 'Colocado'][i % 4], esInquilino: i % 4 === 3, notas: 'Nota larga de ejemplo para forzar el ancho de la tarjeta en pantalla', tenant_id: TENANT_ID, created_at: '2026-01-01T00:00:00Z' }));
const inquilinos = Array.from({ length: 8 }, (_, i) => ({ id: `inq-${i}`, cliente_id: i + 1, habitacion_id: `HAB-${n(i)}`, fecha_entrada: '2026-01-01', fecha_fin_contrato: '2027-01-01', importe_mensual: 450, dia_pago: 5, activo: true, tenant_id: TENANT_ID, fianza_importe: 450, fianza_pagada: true, notas: 'Nota larga de ejemplo para forzar ancho en la tabla de inquilinos', created_at: '2026-01-01T00:00:00Z' }));
const pagos = Array.from({ length: 20 }, (_, i) => ({ id: `pago-${i}`, inquilino_id: `inq-${i % 8}`, cliente_id: (i % 8) + 1, mes: '2026-09-01', importe: 450, importe_inicial: 450, recibido: i % 3 === 0, estado: i % 3 === 0 ? 'Pagado' : null, fecha_vencimiento: '2026-09-05', tipo_pago: 'mensualidad', concepto: 'Mensualidad', tenant_id: TENANT_ID, created_at: '2026-09-01T00:00:00Z' }));
const propietarios = [{ id: 'p1', nombre: 'Propietario De Ejemplo Con Nombre Muy Largo', telefono: '34600999888', email: 'propietario.ejemplo@correolargo.com', nif: '12345678Z', tenant_id: TENANT_ID, es_predeterminado: true, razon_social: 'Propietario Ejemplo SL' }];
const incidencias = Array.from({ length: 5 }, (_, i) => ({ id: `inc-${i}`, inquilino_id: `inq-${i % 8}`, descripcion: 'Descripcion larga de la incidencia para probar el ancho disponible', prioridad: 'media', estado: 'Enviada', resuelta: false, tenant_id: TENANT_ID, created_at: '2026-09-01T10:00:00Z' }));
const captacionLeads = Array.from({ length: 14 }, (_, i) => ({
  id: `lead-${i}`,
  nombre: `Propietario potencial con nombre largo ${i}`,
  telefono: `+34 600 111 ${String(100 + i).padStart(3, '0')}`,
  email: `captacion.numero.${i}@correolargodeejemplo.com`,
  ubicacion: `Calle de la Propiedad ${i}, Alcalá de Henares`,
  notas: 'Quiere valorar la gestión integral de la vivienda. Llamar por la tarde y revisar las condiciones comentadas.',
  etapa: ['nuevo_lead', 'contacto_con_lead', 'visita_pendiente', 'visita_agendada', 'negociacion', 'seguimiento_corto', 'propiedad_captada'][i % 7],
  origen: ['meta', 'csv', 'manual'][i % 3],
  tenant_id: TENANT_ID,
  created_at: `2026-10-${String(14 - i).padStart(2, '0')}T10:00:00Z`,
}));

const TABLAS = { perfiles_app: [perfil], tenants: [tenant], pisos, habitaciones, clientes, inquilinos, pagos, propietarios, incidencias, captacion_leads: captacionLeads, gestores: [], relaciones_inmueble_propietario: [], inquilinos_clientes: [], calendario_eventos: [], zonas_calendario: [], planes_seguimiento: [], pasos_seguimiento: [], seguimiento_clientes: [], app_notificaciones: [], meta_paginas: [], pagos_inmueble: [], slots_disponibilidad: [], plantillas_contrato: [], clausulas_contrato: [], contratos: [], inquilinos_archivo: [], facturas: [], logs_ejecuciones: [] };
// Exercise populated financial/calendar states, not only empty placeholders.
const currentMonth = new Date().toISOString().slice(0, 7);
const todayKey = new Date().toISOString().slice(0, 10);
TABLAS.pagos.forEach((payment) => { payment.mes = `${currentMonth}-01`; payment.fecha_vencimiento = `${currentMonth}-05`; payment.id_inmueble = `HAB-${n(Number(payment.id.split('-')[1]) % 8)}`; });
TABLAS.pagos_inmueble = pisos.map((piso, index) => ({
  id: `expense-${index}`, tenant_id: TENANT_ID, id_inmueble: piso.id_inmueble,
  tipo_pago: 'gasto', concepto: 'Suministro de electricidad y mantenimiento del inmueble',
  categoria: 'suministros', importe: 125 + index * 11, estado: index % 2 ? 'pendiente' : 'pagado',
  mes: `${currentMonth}-01`, fecha_pago: todayKey, recurrente: false,
}));
TABLAS.calendario_eventos = [{ id: 'event-1', tenant_id: TENANT_ID, titulo: 'Visita de prueba con un nombre largo', descripcion: 'Comprobar acceso desde móvil', tipo: 'evento', estado: 'pendiente', fecha_inicio: `${todayKey}T10:00:00`, fecha_fin: `${todayKey}T11:00:00`, creado_por: USER_ID }];
TABLAS.gestores = [{ id: 'gestor-1', nombre: 'Gestor de prueba', tenant_id: TENANT_ID, activo: true, color: '#4285f4' }];
TABLAS.incidencias.forEach((incident) => { incident.gestor_id = 'gestor-1'; });
TABLAS.app_notificaciones = [{ id: 'notification-1', user_id: USER_ID, tenant_id: TENANT_ID, tipo: 'info', titulo: 'Revisar el contrato del inmueble de ejemplo', mensaje: 'Notificación de prueba para revisar el ancho y los controles.', leida: false, created_at: new Date().toISOString() }];

// All of these identities, addresses and amounts are fictional demonstration data.
tenant.plan='tier2';tenant.pagado=true;tenant.slug='brisa-ejemplo';tenant.telefono_contacto='';
const names=['Lucía Robles','Mateo Salcedo','Elena Valverde','Hugo Aranda','Nora del Valle','Adrián Soler','Vera Montalvo','Leo Alcázar','Clara Beltrán','Álex Olmedo','Julia Castaño','Bruno Sierra'];
const streets=['Calle del Almendro, 18','Avenida de la Aurora, 42','Calle Jardín Azul, 7','Plaza del Mirador, 3','Paseo de la Ribera, 26','Calle de la Alondra, 11'];
const zones=['Centro','La Flota','El Carmen','Santa Eulalia','Vistalegre','La Seda'];
TABLAS.pisos.forEach((p,i)=>Object.assign(p,{nombre:streets[i],direccion_completa:streets[i],localidad:'Murcia',zona:zones[i],solo_referencia:i<3,por_habitaciones:i<3,precio:i<3?null:850+i*50,alquiler:i<3?null:750+i*50,suministros:i<3?null:100,propietario_id:['p1','p2','p3'][i%3],tipologia_gestion:i===0?'RENT TO RENT':'GESTION A PORCENTAJE'}));
TABLAS.habitaciones=Array.from({length:9},(_,i)=>({id_inmueble:`HAB-${n(i)}`,piso_id:`PISO-${n(Math.floor(i/3))}`,nombre:`Habitación ${i%3+1}`,zona:zones[Math.floor(i/3)],tipo_unidad:'Individual',precio:420+i*15,alquiler:365+i*15,suministros:55,estado:i<6?'alquilada':'disponible',propietario_id:['p1','p2','p3'][Math.floor(i/3)],tenant_id:TENANT_ID,created_at:'2026-10-01T10:00:00Z'}));
TABLAS.clientes=Array.from({length:12},(_,i)=>({id:i+1,nombre:names[i],telefono:34000001000+i,prefijo:'34',email:`persona${i+1}@brisa.example.com`,zona:zones[i%6],presupuesto_max:500+i*25,tipo_habitacion:'Individual',seguimiento:i<6?'Colocado':['Nuevo','Contactado','Formulario completado','Pisos enviados','Enlaces visitas','Documentación pendiente'][i-6],esInquilino:i<6,notas:'Busca una vivienda luminosa, bien conectada y con espacio para teletrabajar.',tenant_id:TENANT_ID,created_at:`2026-10-${n(10+i)}T10:00:00Z`,fecha_registro:`2026-10-${n(10+i)}T10:00:00Z`}));
TABLAS.inquilinos=Array.from({length:6},(_,i)=>({id:`inq-${i}`,cliente_id:i+1,habitacion_id:`HAB-${n(i)}`,fecha_entrada:'2026-09-01',fecha_inicio_contrato:'2026-09-01',fecha_fin_contrato:i===0?'2026-11-30':'2027-08-31',importe_mensual:420+i*15,alquiler:365+i*15,suministros:55,dia_pago:5,activo:true,tenant_id:TENANT_ID,fianza_importe:420+i*15,fianza_pagada:true,notas:'Documentación revisada. Contrato de arrendamiento firmado.',created_at:'2026-09-01T10:00:00Z'}));
TABLAS.pagos=Array.from({length:18},(_,i)=>{const t=i%6,m=i<6?'2026-09':i<12?'2026-10':'2026-11';const paid=i<9;return {id:`pago-${i}`,inquilino_id:`inq-${t}`,cliente_id:t+1,id_inmueble:`HAB-${n(t)}`,mes:`${m}-01`,importe:420+t*15,importe_inicial:420+t*15,recibido:paid,estado:paid?'Pagado':i<12?'pendiente':'futuro',fecha_vencimiento:`${m}-05`,fecha_pago:paid?`${m}-04`:null,tipo_pago:'mensualidad',concepto:`Alquiler ${m==='2026-09'?'septiembre':m==='2026-10'?'octubre':'noviembre'}`,tenant_id:TENANT_ID,created_at:`${m}-01T10:00:00Z`}});
TABLAS.propietarios=[{id:'p1',nombre:'Inés Valcárcel',razon_social:'',telefono:'34000002001',email:'ines@brisa.example.com',tenant_id:TENANT_ID,es_predeterminado:false},{id:'p2',nombre:'Gabriel Lomas',telefono:'34000002002',email:'gabriel@brisa.example.com',tenant_id:TENANT_ID,es_predeterminado:false},{id:'p3',nombre:'Brisa Patrimonio',razon_social:'Brisa Patrimonio de Ejemplo SL',telefono:'34000002003',email:'patrimonio@brisa.example.com',tenant_id:TENANT_ID,es_predeterminado:true}];
TABLAS.relaciones_inmueble_propietario=TABLAS.pisos.map((p,i)=>({id:`rel-${i}`,id_inmueble:p.id_inmueble,propietario_id:p.propietario_id,porcentaje:100,tenant_id:TENANT_ID}));
TABLAS.incidencias.forEach((incident,i)=>Object.assign(incident,{titulo:['Grifo de cocina','Persiana del dormitorio','Revisión de climatización','Iluminación del portal','Cerradura de acceso'][i],descripcion:['El grifo de la cocina gotea. Visita del fontanero programada.','La persiana no sube con normalidad. Revisión pendiente.','Mantenimiento preventivo del equipo de aire acondicionado.','Sustitución de una lámpara del portal.','Revisar el cierre de la puerta principal.'][i],prioridad:['media','baja','media','baja','alta'][i],estado:i===3?'Resuelta':'Enviada',resuelta:i===3,created_at:`2026-10-${n(20+i)}T10:00:00Z`,habitacion_id:`HAB-${n(i)}`}));
TABLAS.pagos_inmueble.forEach((p,i)=>Object.assign(p,{concepto:['Suministro eléctrico','Revisión de fontanería','Limpieza de zonas comunes','Seguro de vivienda','Comunidad de propietarios','Mantenimiento de climatización'][i],categoria:['electricidad','mantenimiento','limpieza','seguro','comunidad','mantenimiento'][i],importe:[86.4,95,120,210,65,145][i],mes:'2026-10-01',fecha_pago:'2026-10-20'}));
TABLAS.gestores=[{id:'gestor-1',nombre:'Clara Montes',tenant_id:TENANT_ID,activo:true,color:'#dba81f'}];
TABLAS.app_notificaciones=[];
TABLAS.calendario_eventos=Array.from({length:5},(_,i)=>({id:`event-${i}`,tenant_id:TENANT_ID,titulo:['Visita · Calle del Almendro','Revisión de contrato · Elena','Entrega de llaves · Mateo','Mantenimiento · Jardín Azul','Visita · Plaza del Mirador'][i],descripcion:'Evento de demostración',tipo:i%2?'evento':'visita',estado:'pendiente',fecha_inicio:`2026-10-${n(26+i)}T${n(10+i)}:00:00`,fecha_fin:`2026-10-${n(26+i)}T${n(11+i)}:00:00`,creado_por:USER_ID,gestor_id:'gestor-1'}));
TABLAS.contratos=TABLAS.inquilinos.map((t,i)=>({id:`contrato-${i}`,tenant_id:TENANT_ID,inquilino_id:t.id,propietario_id:TABLAS.habitaciones[i].propietario_id,id_inmueble:t.habitacion_id,tipo:'inquilino_vivienda',numero_contrato:`BR-2026-${n(i+1)}`,estado:i===5?'borrador':'firmado',firma_estado:i===5?'not_sent':'completed',fecha_inicio:t.fecha_inicio_contrato,fecha_fin:t.fecha_fin_contrato,created_at:'2026-09-01T10:00:00Z',updated_at:'2026-10-21T11:00:00Z',datos_snapshot:{inquilino_nombre:names[i],inmueble_direccion:streets[Math.floor(i/3)],habitacion_nombre:`Habitación ${i%3+1}`,alquiler_mensual:t.importe_mensual},contenido_html:'<h1>Contrato de arrendamiento de demostración</h1><p>Contenido ficticio para presentar la interfaz.</p>'}));
TABLAS.captacion_leads.forEach((lead,i)=>Object.assign(lead,{nombre:['Alba Cerezo','Víctor Navas','Marina Valdés','Sergio Pardo','Olivia Casas','Daniel Fresno','Eva Oliva'][i%7],telefono:`34000003${String(i).padStart(3,'0')}`,email:`captacion${i}@brisa.example.com`,ubicacion:streets[i%6],notas:'Solicita información sobre gestión de alquileres. Contactar por la tarde.'}));
TABLAS.facturas=[{id:'fact-1',tenant_id:TENANT_ID,numero:'BR-2026-001',serie:'BR',fecha:'2026-10-01',fecha_emision:'2026-10-01',estado:'emitida',tipo:'emitida',cliente_nombre:'Brisa Patrimonio de Ejemplo SL',base_imponible:720,iva_porcentaje:21,iva_importe:151.2,total:871.2,concepto:'Gestión de alquileres · octubre',created_at:'2026-10-01T10:00:00Z'}];

TABLAS.pisos.forEach((p,i)=>{p.id='piso-row-'+i;if(i>=3)p.estado='disponible';p.coste_propietario=350+i*50;p.importe_propietario=350+i*50;});
TABLAS.habitaciones.forEach((p,i)=>p.id='hab-row-'+i);
TABLAS.propietarios.forEach((p,i)=>{p.fecha_inicio_contrato='2026-01-01';p.fecha_fin_contrato=['2026-11-25','2027-02-28','2027-06-30'][i];});
TABLAS.contratos_servicios=[{id:'serv-1',nombre:'Seguro multirriesgo · Almendro',fecha_vencimiento:'2026-11-12',notas:'Renovación anual de la póliza de demostración.',propietario_id:'p1',inmueble_id:'PISO-00',tenant_id:TENANT_ID},{id:'serv-2',nombre:'Mantenimiento climatización · Aurora',fecha_vencimiento:'2026-12-15',notas:'Contrato de mantenimiento preventivo.',propietario_id:'p2',inmueble_id:'PISO-01',tenant_id:TENANT_ID}];
TABLAS.zonas_calendario=zones.map((nombre,i)=>({id:'zona-'+i,zona:nombre,nombre,color:['#f59e0b','#10b981','#6366f1'][i%3],tenant_id:TENANT_ID}));
TABLAS.slots_disponibilidad=Array.from({length:12},(_,i)=>({id:'slot-'+i,tenant_id:TENANT_ID,zona:zones[i%3],fecha:'2026-10-'+n(28+Math.floor(i/4)),hora_inicio:n(10+i%4)+':00',hora_fin:n(10+i%4)+':30',gestor_id:'gestor-1',reservado:i<2,cliente_id:i<2?i+7:null,cliente_nombre:i<2?names[i+6]:null,cliente_email:i<2?'persona'+(i+7)+'@brisa.example.com':null,tipo:'puntual'}));
TABLAS.pagos_inmueble.forEach((p,i)=>{p.archivo_url='https://documents.example.com/factura-demostracion-'+(i+1)+'.pdf';p.archivo_tipo='pdf';p.drive_file_id='documento-ficticio-'+i;});
TABLAS.contratos.forEach((c,i)=>{c.estado=i===5?'borrador':'completado';c.firma_estado=i===5?'pendiente':'firmada';c.es_version_vigente=true;c.version_num=1;c.contrato_raiz_id=c.id;});
const blocked=new Set(),errors=[],captures=[];
process.chdir(app);
const server=await createServer({root:app,configFile:path.join(app,'vite.web.config.js'),server:{host:'127.0.0.1',port:5198,strictPort:true}});
let browser;
try {
 await server.listen();
 browser=await chromium.launch({headless:true});
 const ctx=await browser.newContext({viewport:{width:1600,height:1000},deviceScaleFactor:1,serviceWorkers:'block'});
 await ctx.addInitScript(()=>{const NativeDate=Date;globalThis.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:['2026-10-28T10:00:00Z']));}static now(){return new NativeDate('2026-10-28T10:00:00Z').getTime();}};});
 await ctx.addInitScript(({uid,email})=>{const expires_at=Math.floor(Date.now()/1000)+31536000;localStorage.setItem('invicta-supabase-auth',JSON.stringify({access_token:'fake.jwt.token',token_type:'bearer',expires_in:31536000,expires_at,refresh_token:'fake-refresh',user:{id:uid,aud:'authenticated',role:'authenticated',email,app_metadata:{},user_metadata:{},created_at:'2026-01-01T00:00:00Z'}}));localStorage.setItem(`nize-tutorial-v1-${uid}`,'done');localStorage.setItem('theme','light');},{uid:USER_ID,email:perfil.email});
 await ctx.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname==='127.0.0.1') return route.continue();
  blocked.add(url.origin);
  let body={};
  if(url.hostname.endsWith('supabase.co')) {
   const p=url.pathname; const single=(route.request().headers()['accept']||'').includes('vnd.pgrst.object');
   if(p.startsWith('/auth/v1/')) body={id:USER_ID,email:perfil.email,aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}};
   else if(p.startsWith('/rest/v1/rpc/')) body=null;
   else if(p.startsWith('/rest/v1/')) {const rows=TABLAS[p.slice('/rest/v1/'.length)]||[];body=single?(rows[0]??null):rows;return route.fulfill({status:200,contentType:'application/json',headers:{'Content-Range':`0-${Math.max(0,rows.length-1)}/${rows.length}`},body:JSON.stringify(body)});}
  }
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
 });
 const page=await ctx.newPage(); page.setDefaultTimeout(12000);page.setDefaultNavigationTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5198/renderer-web.html',{waitUntil:'domcontentloaded'});
 await page.waitForSelector('.nize-studio-shell',{timeout:90000});await page.waitForTimeout(10000);await page.evaluate(()=>document.fonts.ready);
 const tabs=await page.locator('[data-tour^="nav-"]').evaluateAll(els=>els.map(e=>e.dataset.tour.slice(4)));
 async function shot(name){await page.mouse.move(1595,995);await page.waitForTimeout(400);await page.screenshot({path:path.join(OUT,`${name}.png`)});const text=await page.locator('.nize-studio-main').innerText();captures.push({name,width:1600,height:1000,text:text.slice(0,4000)});console.log('CAPTURED',name);}
 for(const tab of tabs){try{await page.locator(`[data-tour="nav-${tab}"]`).first().click();await page.waitForTimeout(1800);
  if(tab==='seendy'){const frame=page.frameLocator('iframe[title="Seendy"]');await frame.locator('body').evaluate(async()=>{const {createDemo}=await import('/src/seendy/lib/demo-data.ts');const data=createDemo();data.organization.name='Brisa Gesti\u00f3n Inmobiliaria';data.organization.slug='brisa-ejemplo';const names=['Luc\u00eda Robles','Mateo Salcedo','Elena Valverde','Hugo Aranda','Nora del Valle','Adri\u00e1n Soler','Vera Montalvo','Leo Alc\u00e1zar','Clara Beltr\u00e1n','Alex Olmedo','Julia Casta\u00f1o','Bruno Sierra'];data.contacts.forEach((c,i)=>{c.name=names[i];c.phone='+34 000 001 '+String(i).padStart(3,'0');c.email='persona'+(i+1)+'@brisa.example.com';c.company='';});const texts=['Hola, me interesa la vivienda de la calle del Almendro.','Hola, Luc\u00eda. Soy Alba, la asistente de Brisa. Puedo ayudarte con la visita.','Busco una habitaci\u00f3n luminosa y bien conectada con el centro.','Tenemos una habitaci\u00f3n exterior disponible. El alquiler incluye suministros.','Perfecto, \u00bfpodemos verla esta semana?','S\u00ed. Clara, nuestra gestora, contin\u00faa contigo para concretar la visita.'];let i=0;data.messages.forEach(m=>{if(m.conversation_id==='conversation-0'){m.body=texts[(i++)%texts.length];if(m.sender_type==='contact')m.sender_name=names[0];}});localStorage.setItem('seendy-demo-v1',JSON.stringify(data));location.hash='/demo';});await frame.locator('.conversation-row').first().waitFor();await frame.locator('.conversation-row').first().click();await page.waitForTimeout(600);}
  await shot(tab);
  if(tab==='inmuebles') {const visual=page.getByRole('button',{name:/Mapa visual|Vista visual|Visual/,exact:false});console.log('VISUAL BUTTONS',await visual.allTextContents());if(await visual.count()){await visual.first().click();await page.waitForTimeout(1000);await page.locator('.hm-tenant-map').first().evaluate(el=>el.scrollIntoView({block:'start'}));await shot('inmuebles-jerarquia');await page.locator('.hm-tenant-map').first().screenshot({path:path.join(OUT,'inmuebles-diagrama.png')});}}
 if(tab==='clientes'){await page.getByPlaceholder(/Buscar en todos los interesados/).first().evaluate(el=>el.scrollIntoView({block:'start'}));await shot('clientes-listado');}
  if(tab==='captacion'){await page.locator('.captacion-pipeline').evaluate(el=>el.scrollIntoView({block:'start'}));await shot('captacion-pipeline');}
  if(tab==='pagos-inmueble'){await page.locator('.expense-group-header').first().click({position:{x:20,y:20}});await page.locator('.expense-group-header').first().evaluate(el=>el.scrollIntoView({block:'start'}));await shot('gastos-facturas-adjuntas');}
  if(tab==='pagos'){await page.getByRole('button',{name:'Por inquilino',exact:true}).click();await shot('cobros-inquilinos');}
  if(tab==='renovaciones'){
   for(const [label,name] of [['Contratos de inquilinos','inquilinos'],['Contratos de propietarios','propietarios'],['Otros contratos','otros']]){const header=page.getByRole('button',{name:new RegExp(label)});await header.click();await header.evaluate(el=>el.scrollIntoView({block:'start'}));await shot('renovaciones-'+name);}
  }
  if(tab==='reporte-mensual'){await page.getByText('Crear nueva factura',{exact:true}).click();await page.waitForTimeout(400);await shot('facturacion-crear');await page.getByRole('button',{name:'Cerrar ventana',exact:true}).first().click();}
 }catch(e){errors.push(`${tab}: ${e.message}`);console.log('FAILED',tab,e.message)}}
 fs.writeFileSync(path.join(OUT,'capture-report.json'),JSON.stringify({generatedAt:new Date().toISOString(),mode:'Actual current local CRM source rendered by Vite; all data fictional; external requests intercepted',tabs,captures,blockedOrigins:[...blocked],errors},null,2));
} finally {await browser?.close();await server.close();}
