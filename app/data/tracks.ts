export interface Track {
  id: string;
  title: string;
  artist: string;
  src: string;
  startTime: number;
  background?: string | { wide: string; tall?: string };
}

export const TRACKS: Track[] = [
  {
    id: "track-1",
    title: "आता तरी देवा मला पावशील का",
    artist: "प्रल्हाद शिंदे",
    src: "/music/aata-tari-deva-mala-pavshil-ka_CM3ZzugO.mp3",
    startTime: 4,
    background: "/images/background_img1.webp"
  },
  {
    id: "track-2",
    title: "अबीर गुलाल उधळीत रंग",
    artist: "Pt. Jitendra Abhisheki",
    src: "/music/abir-gulal-udhalit-rang-with-lyrics-abra-gall-uthhalita_BJVlOqPF.mp3",
    startTime: 4,
    background: "/images/background_img2.webp"
  },
  {
    id: "track-3",
    title: "चल ग सखे पंढरीला",
    artist: "प्रल्हाद शिंदे",
    src: "/music/cal-ga-sakha-padharal-vathathal-bhakataga_eEPb13i1.mp3",
    startTime: 4,
    background: "/images/background_img3.webp"
  },
  {
    id: "track-4",
    title: "चंद्रभागेच्या तीरी",
    artist: "प्रल्हाद शिंदे",
    src: "/music/chandrabhagechya-tiri_eFAamt9F.mp3",
    startTime: 4,
    background: "/images/background_img4.webp"
  },
  {
    id: "track-5",
    title: "जैसे ज्याचे कर्म",
    artist: "प्रल्हाद शिंदे",
    src: "/music/jaise-jayache-karma-audio-song-jasa-jayaca-karama-prah_zDJU2xhQ.mp3",
    startTime: 4,
    background: "/images/background_img5.webp"
  },
  {
    id: "track-6",
    title: "कानडा राजा पंढरीचा",
    artist: "सुधीर फडके",
    src: "/music/kanada-raja-pandharicha_zaKUP8mt.mp3",
    startTime: 4,
    background: "/images/background_img6.webp"
  },
  {
    id: "track-7",
    title: "माझे माहेर पंढरी",
    artist: "Pt. Bhimsen Joshi",
    src: "/music/majhe-maher-pandhari-majha-mahara-padhara-pt-bhimsen-jo_MwlHNvNG.mp3",
    startTime: 4,
    background: "/images/background_img7.webp"
  },
  {
    id: "track-8",
    title: "पाउले चालती पंढरीची वाट",
    artist: "शुभंगी जोशी",
    src: "/music/shubhangi-joshi-paule-chalati-pandharichi-vaat-mp3pm-1_s2KVFjdp.mp3",
    startTime: 4,
    background: "/images/background_img8.webp"
  },
  {
    id: "track-9",
    title: "सुंदर ते ध्यान",
    artist: "पारंपारिक",
    src: "/music/sundar-te-dhyan_UIIOYXpw.mp3",
    startTime: 4,
    background: "/images/background_img9.webp"
  },
  {
    id: "track-10",
    title: "विठ्ठल विठ्ठल माऊली",
    artist: "पारंपारिक",
    src: "/music/vitthal-vitthal-mauli_BOW1NYMx.mp3",
    startTime: 4,
    background: "/images/background_img10.webp"
  }
];
