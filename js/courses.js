const COURSE_DATA = [
  ["Apoyo avanzado vital al paciente traumatizado",50000],
  ["Atención psico-pedagógica a la primera infancia",50000],
  ["Auditoría en salud",50000],
  ["Inclusión en atención diferencial LGTBI",50000],
  ["Avanzado de camillero",50000],
  ["Avanzado de cuidados paliativos",50000],
  ["Avanzado de primeros auxilios",50000],
  ["Ruta integral de atención materno perinatal",50000],
  ["Seguridad y salud en el trabajo",50000],

  ["Vacunación con énfasis en COVID-19",50000],
  ["Bioseguridad aplicada a la estética y belleza",40000],
  ["Buenas prácticas clínicas",50000],
  ["Central de esterilización",50000],
  ["Cuidado integral al paciente oncológico",50000],
  ["Cuidados al paciente con discapacidad",50000],
  ["Cuidados intermedios hospitalarios",50000],
  ["Cuidados intermedios hospitalarios neonato-pediátrico",50000],
  ["Cuidados médico-quirúrgicos",50000],

  ["Enfermedad diarreica aguda",50000],
  ["Enfermedades transmitidas por vectores",50000],
  ["Farmacodependencia",50000],
  ["Farmacovigilancia",50000],
  ["Integridad y transparencia contra la corrupción",50000],
  ["Interrupción voluntaria del embarazo",50000],
  ["Manejo de prueba rápida en punto de atención",50000],
  ["Manejo del paciente con ataque cerebro-vascular",50000],
  ["Misión médica",50000],

  ["Modelo de acción integral territorial",50000],
  ["Primeros auxilios psicológicos",50000],
  ["Radio-protección radiológica",50000],
  ["Referencia y contra-referencia",50000],
  ["Soporte cardiovascular -ACLS-",50000],
  ["Soporte cardiovascular neonatal",50000],
  ["Soporte cardiovascular pediátrico",50000],
  ["Soporte de vida obstétrico",50000],
  ["Tecnovigilancia",50000],

  ["Sonda vesical y nasogástrica",20000],
  ["Sueroterapia",20000],
  ["Terapia respiratoria y oxigenoterapia",20000],
  ["Toma y conservación de muestras de laboratorio clínico",20000],
  ["Toma e interpretación electrocardiografía",20000],
  ["Toma y transporte de citologías cérvico uterinas",20000],
  ["Transfusión sanguínea",20000],
  ["Transporte asistencial básico",20000],
  ["Urgencias críticas",20000],

  ["Manejo del dolor",20000],
  ["Manejo integral de la desnutrición",20000],
  ["Mecánica básica",30000],
  ["Minuto de oro",20000],
  ["Operador de vehículos de emergencia",20000],
  ["Planificación familiar",20000],
  ["Primer respondiente",20000],
  ["Paciente crónico con enfermedades terminales",20000],
  ["Parto humanizado",20000],

  ["Instituciones amigas de la mujer y la infancia",20000],
  ["Inserción y extracción del dispositivo",20000],
  ["Inyectología y sueros",20000],
  ["Lactancia materna",20000],
  ["Lenguaje de señas en Colombia",20000],
  ["Manejo al paciente con VIH",20000],
  ["Manejo de extintores y control de incendios",20000],
  ["Manejo defensivo",20000],
  ["Manejo del desfibrilador externo automático",20000],

  ["Emergencia obstétrica",20000],
  ["Emergencia y desastres con énfasis en rutas de evacuación",20000],
  ["Facturación en los servicios de salud",20000],
  ["Gestión del duelo",20000],
  ["Gestión integral de residuos hospitalarios y similares",20000],
  ["Higiene de manos y retiro de EPP",20000],
  ["Humanización en servicios de salud",20000],
  ["Implante subdérmico",30000],
  ["Diálisis y hemodiálisis",20000],

  ["Control prenatal",20000],
  ["Control y prevención de infecciones hospitalarias",20000],
  ["Cuidado al paciente crítico",20000],
  ["Cuidador en los servicios de salud",20000],
  ["Cuidados paliativos",20000],
  ["Desnutrición aguda moderada y severa infantil",20000],
  ["Detección y cuidado del donante de órganos y tejidos",30000],
  ["Diagnóstico y manejo clínico del dengue",30000],


  ["Atención integral en salud oral",30000],
  ["Atención prehospitalaria",20000],
  ["Atención primaria en salud",20000],
  ["Autoexamen mamario",20000],
  ["Banco de sangre",20000],
  ["Seguridad y salud en el trabajo — complementario",30000],
  ["Bioseguridad en riesgo biológico",20000],
  ["Bioseguridad y desinfección en áreas locativas",20000],
  ["Brigadista de emergencias",20000],

  ["Atención al consumidor de sustancias psicoactivas",20000],
  ["Atención al paciente neonatal",20000],
  ["Atención centrada al usuario en salud",20000],
  ["Atención domiciliaria",20000],
  ["Atención a víctimas del conflicto armado con enfoque PAPSIVI",20000],
  ["Atención integral al adulto mayor en salud",20000],
  ["Atención integral de enfermedades prevalentes de la infancia clínico - AIEPI",20000],
  ["Atención integral de enfermedades prevalentes de la infancia comunitario - AIEPI",20000],
  ["Atención integral del paciente quemado",20000],

  ["Abordaje del paciente con COVID-19",20000],
  ["Administración de inmunobiológicos",20000],
  ["Administración de medicamentos",20000],
  ["Apoyo al automanejo en diabetes",20000],
  ["Asesoría en salud sexual y reproductiva",20000],
  ["Asesoría y prueba voluntaria de VIH",20000],
  ["Atención a víctimas de ataques con agentes químicos",20000],
  ["Atención a víctimas de la violencia intrafamiliar",20000],
  ["Atención a víctimas de violencia de género",20000]
];

function slugify(text){
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

function categorize(name){
  const n=name.toLowerCase();
  if(/obst|mater|prenatal|lactancia|infancia|neonat|parto|planific|subdérmico|cérvico|mujer/.test(n)) return 'Maternidad e infancia';
  if(/primeros auxilios|urgencias|emergencia|desfibrilador|cardiovascular|traumat|prehospital|respondiente|transporte asistencial|misión médica|camillero/.test(n)) return 'Urgencias y emergencias';
  if(/bioseguridad|infecciones|higiene|epp|residuos|esterilización|vacunación|inmunobiológicos/.test(n)) return 'Bioseguridad';
  if(/farmaco|medicamentos|inyectología|sueroterapia|prueba rápida|muestras|banco de sangre|transfusión/.test(n)) return 'Medicamentos y laboratorio';
  if(/seguridad y salud|extintores|incendios|mecánica|vehículos|manejo defensivo|brigadista/.test(n)) return 'Seguridad y trabajo';
  if(/duelo|psicol|humanización|discapacidad|violencia|sustancias|lenguaje de señas|adulto mayor|corrupción|inclusión/.test(n)) return 'Humanización y bienestar';
  if(/auditoría|facturación|referencia|acción integral territorial|tecnovigilancia|radiológica|salud primaria|buenas prácticas/.test(n)) return 'Gestión y salud pública';
  return 'Cuidado clínico';
}

window.COURSES = COURSE_DATA.map((c,i)=>({
  id:i+1,
  name:c[0],
  price:c[1],
  slug:slugify(c[0]),
  category:categorize(c[0]),
  image:`assets/course-thumbs/course-${String(i+1).padStart(3,'0')}.jpg`
}));
