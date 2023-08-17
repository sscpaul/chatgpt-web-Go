import styled from '@emotion/styled';
import React from 'react';
import { Typography } from './Typography';

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  collapsed?: boolean;
}

const StyledLogo = styled.div`
  width: 35px;
  min-width: 35px;
  height: 35px;
  min-height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: white;
  font-size: 24px;
  font-weight: 700;
  background-color: #009fdb;
  background: linear-gradient(45deg, rgb(21 87 205) 0%, rgb(90 225 255) 100%);
`;

const StyledSidebarHeader = styled.div`
  height: 64px;
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
`;

const StyledCollapsedSidebarHeader = styled.span`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: white;
`;

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ children, collapsed, ...rest }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px'}}>
      {collapsed ? (
        <StyledCollapsedSidebarHeader>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <StyledLogo>C</StyledLogo>
          </div>
        </StyledCollapsedSidebarHeader>
      ) : (
        <StyledSidebarHeader {...rest}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<StyledLogo>C</StyledLogo>
            <Typography variant="h6" fontWeight={700} color="#0098e5">
              hatGPT
            </Typography>
          </div>
        </StyledSidebarHeader>
      )}
    </div>
  );
};
