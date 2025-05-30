import Footer from "@/src/components/Footer";
import Navbar from "@/src/components/Navbar";
import Section2 from "@/src/containers/Home/Section2";
import { Container, Box } from "@mui/material";
import Image from "next/image";
import React from "react";
import Bg1 from "@/src/assets/images/bg1.svg";
import Bg2 from "@/src/assets/images/bg2.svg";
import Section5 from "@/src/containers/Home/Section5";
import Section9 from "@/src/containers/Home/Section9";

const Home = () => {
  return (
    <Box sx={{ pb: 3 }}>
      <Navbar />
      <Box sx={{ position: "relative", overflow: "hidden" }}>
        <Section2 />
        <Container maxWidth="lg" sx={{ position: "relative", pb: 0 }}>
          <Image
            src={Bg1}
            alt="BG 1"
            style={{
              position: "absolute",
              top: 50,
              width: "650px",
              height: "650px",
              objectFit: "contain",
              zIndex: -1,
            }}
          />
          <Image
            src={Bg2}
            alt="BG 2"
            style={{
              position: "absolute",
              right: 0,
              bottom: 80,
              width: "650px",
              height: "650px",
              objectFit: "contain",
              zIndex: -1,
            }}
          />
          <Section5 />
        </Container>
        <Section9 />
      </Box>
      <Footer />
    </Box>
  );
};

export default Home;
