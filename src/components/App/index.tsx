import { Routes, Route } from "react-router-dom";
import styled from "styled-components";
import { BrowserView, MobileView } from "react-device-detect";

import ImageLayout from "../ImageLayout";
import AppHeader from "../AppHeader";
import Mobile from "../Mobile";

function App() {
  return (
    <>
      <BrowserView>
        <AppHeader />
        <Main>
          <Container>
            <Routes>
              <Route path="/" element={<ImageLayout />} />
            </Routes>
          </Container>
        </Main>
      </BrowserView>
      <MobileView>
        <Mobile />
      </MobileView>
    </>
  );
}

const Main = styled.main`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
`;

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

export default App;
