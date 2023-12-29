import { Link } from "react-router-dom";
import styled from "styled-components";
import logo from "../../assets/logo.svg";

function AppHeader() {
  return (
    <>
      <Header>
        <Link to="/">
          <Logo src={logo} alt="object horizon logo" />
        </Link>
      </Header>
    </>
  );
}

const Header = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  z-index: 1000;
`;

const Logo = styled.img`
  height: 100%;
  object-fit: contain;
`;

export default AppHeader;
