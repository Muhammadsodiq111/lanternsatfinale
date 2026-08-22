import ParticleText from "@/components/ParticleText";

export function Colleges() {
  return (
    <section id="free">
      <div style={{ width: "100%", height: 360, background: "#09090f" }}>
        <ParticleText
          text="All For Free"
          particleSize={2}
          density={4}
          color="#ffffff"
          highlightColor="#EAB308"
          scatter={180}
          gatherDuration={1600}
          stagger={420}
          pointerRepel={40}
          repelRadius={120}
          idleDrift={0.7}
          trigger="hover"
          fontSize="clamp(3rem, 12vw, 8rem)"
          fontWeight={800}
          fontFamily="inherit"
          glow
        />
      </div>
    </section>
  );
}
