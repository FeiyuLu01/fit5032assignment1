export async function fetchPrograms() {
    await new Promise(r => setTimeout(r, 150));
    return [
      { id:'p1', title:'U16 Skills Clinic', level:'Beginner–Intermediate', price:10,
        date:'2025-09-05', location:'Footscray Community Gym',
        desc:'Ball-handling, shooting form, defensive footwork. 90 mins.' },
      { id:'p2', title:'Holiday 3x3 Tournament', level:'Open', price:0,
        date:'2025-09-20', location:'Brunswick Court 2',
        desc:'Friendly 3x3 with coaches refereeing. Register teams of 3–5.' },
      { id:'p3', title:'Girls’ Saturday Morning', level:'Beginner', price:5,
        date:'2025-10-04', location:'Coburg Youth Centre',
        desc:'Inclusive entry program focused on fun & fundamentals.' }
    ];
  }
  
  
  export async function fetchCourts() {
    await new Promise(r => setTimeout(r, 120));
    return [
      { id:'c1', name:'Footscray Court', suburb:'Footscray', lights:true, indoor:false,
        lat:-37.799, lng:144.899, cost:'Free', surfaces:['Asphalt'], hours:'6am–10pm' },
      { id:'c2', name:'Brunswick Court 2', suburb:'Brunswick', lights:true, indoor:true,
        lat:-37.764, lng:144.961, cost:'$8/hr', surfaces:['Timber'], hours:'8am–9pm' },
      { id:'c3', name:'Coburg Youth Centre', suburb:'Coburg', lights:false, indoor:true,
        lat:-37.745, lng:144.966, cost:'$5/hr', surfaces:['Rubber'], hours:'9am–6pm' }
    ];
  }
  
  export async function fetchCourtById(id) {
    const list = await fetchCourts();
    return list.find(c => c.id === id) || null;
  }