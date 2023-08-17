import React, { useEffect, useState } from 'react';
import { ProSidebarProvider, Menu, MenuItem, menuClasses, MenuItemStyles } from 'react-pro-sidebar';
import { SidebarHeader } from './SidebarHeader';
import { SidebarFooter } from './SidebarFooter';
import { Typography } from './Typography';
import { DeleteTwoTone, EditTwoTone, ExclamationCircleFilled } from '@ant-design/icons';
import { Space, Button, Tooltip, Modal, Input } from 'antd';
import { deleteChat, renameChatSubject } from '../services/port';
import moment from 'moment';
import Sider from 'antd/es/layout/Sider';

interface ChatSidebarProps extends React.HTMLAttributes<HTMLHtmlElement> {
  children?: React.ReactNode;
  collapsed?: boolean;
  toggled?: boolean;
  data?: string;
  onMenuItemClick?: (id: number, chatID: string, subject: string) => void;
  onNewChatClick?: () => void;
  footerEvent?: (key: string, value: any)  => Promise<any>;
  refreshMenu?: (chatID: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ children, collapsed, toggled, data, onMenuItemClick, onNewChatClick, footerEvent, refreshMenu, ...rest }) => {
  const [enterMenuItem, setEnterMenuItem] = useState(-1)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [chatID, setChatID] = useState('');
  const { confirm } = Modal;
  const menuRef = React.useRef<HTMLMenuElement>(null);
  const chatData = JSON.parse(data + '');
  let isAdmin = chatData.IsAdmin;
  let userName = chatData.UserName;
  let chatRecord = chatData.ChatRecord;
  const theme = 'light'
  const hasImage = true

  const handleMenuItemClick = (id: number, chatID: string, subject: string) => {
    onMenuItemClick?.(id, chatID, subject);
  };

  const handleRenameButtonClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent> | 
    React.MouseEvent<HTMLButtonElement, MouseEvent>, chatID: string, subject: string) => {
    event.stopPropagation();
    console.log(event);
    setChatID(chatID);
    setSubject(subject);
    // 显示重命名对话框
    setIsModalOpen(true);
  };

  const handleDeleteButtonClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent> | 
    React.MouseEvent<HTMLButtonElement, MouseEvent>, chatID: string, subject: string) => {
    event.stopPropagation();

    confirm({
      title: '删除确认',
      icon: <ExclamationCircleFilled />,
      content: '确定删除会话【' + subject + '】吗？',
      okText: '是',
      okType: 'danger',
      cancelText: '否',
      onOk() {
        deleteChat(chatID).then((res) => {
          if (res.data.code === 200) {
            refreshMenu?.("");
          } else {
            alert('删除出错：' + res.data.errorMsg)
          }
        });
      },
    });
  };

  const handleRenameModalOk = () => {
    if (subject.trim() === '') {
      alert('会话主题不能为空');
      return;
    }
    setIsModalOpen(false);
    renameChatSubject(chatID, subject).then((res) => {
      if (res.data.code === 200) {
        refreshMenu?.(chatID);
      } else {
        alert('重命名出错：' + res.data.errorMsg)
      }
    });
  };

  const handleRenameModalCancel = () => {
    setIsModalOpen(false);
  };

  // 动态创建 MenuItem 组件
  const renderMenuItems = (chatRecord: any) => {
    if (chatRecord === undefined || chatRecord === null || chatRecord.length === 0) {
      return
    }
    return chatRecord.map((item: any, index: any) => (
      <MenuItem id={item.ChatID} key={item.ChatID} title={'创建时间：' + moment(new Date(item.CreatedAt)).format('YYYY-MM-DD HH:mm:ss') + '\r\n上次更新：'+ moment(new Date(item.UpdatedAt)).format('YYYY-MM-DD HH:mm:ss')} 
        onClick={() => handleMenuItemClick(item.ID, item.ChatID, item.Subject)}
        suffix={(enterMenuItem === item.ID) ? 
          <Space>
            <Tooltip title="重命名">
              <Button shape="circle" size="small" icon={<EditTwoTone/>} onClick={(e) => handleRenameButtonClick(e, item.ChatID, item.Subject)} />
            </Tooltip>
            <Tooltip title="删除会话">
              <Button shape="circle" size="small" icon={<DeleteTwoTone/>} onClick={(e) => handleDeleteButtonClick(e, item.ChatID, item.Subject)} />
            </Tooltip>
          </Space>
        : null}
        onMouseEnter={(e) => setEnterMenuItem(item.ID)}
        onMouseLeave={(e) => setEnterMenuItem(-1)}>{item.Subject}
      </MenuItem>
    ))
  }

  // hex to rgba converter
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const themes = {
    light: {
      sidebar: {
        backgroundColor: '#ffffff',
        color: '#607489',
      },
      menu: {
        menuContent: '#fbfcfd',
        icon: '#0098e5',
        hover: {
          backgroundColor: '#c5e4ff',
          color: '#44596e',
        },
        disabled: {
          color: '#9fb6cf',
        },
      },
    },
    dark: {
      sidebar: {
        backgroundColor: '#0b2948',
        color: '#8ba1b7',
      },
      menu: {
        menuContent: '#082440',
        icon: '#59d0ff',
        hover: {
          backgroundColor: '#00458b',
          color: '#b6c8d9',
        },
        disabled: {
          color: '#3e5e7e',
        },
      },
    },
  };

  const menuItemStyles: MenuItemStyles = {
    root: {
      fontSize: '13px',
      fontWeight: 400,
    },
    icon: {
      color: themes[theme].menu.icon,
      [`&.${menuClasses.disabled}`]: {
        color: themes[theme].menu.disabled.color,
      },
    },
    SubMenuExpandIcon: {
      color: '#b6b7b9',
    },
    subMenuContent: ({ level }) => ({
      backgroundColor:
        level === 0
          ? hexToRgba(themes[theme].menu.menuContent, hasImage && !collapsed ? 0.4 : 1)
          : 'transparent',
    }),
    button: {
      [`&.${menuClasses.disabled}`]: {
        color: themes[theme].menu.disabled.color,
      },
      '&:hover': {
        backgroundColor: hexToRgba(themes[theme].menu.hover.backgroundColor, hasImage ? 0.8 : 1),
        color: themes[theme].menu.hover.color,
      },
    },
    label: ({ open }) => ({
      fontWeight: open ? 600 : undefined,
    }),
  };

  return (
    <Sider breakpoint='xs' theme={theme} collapsed={collapsed} collapsedWidth='0px' width='250px'
      style={{ height: '100vh', backgroundImage: `url('/background.jpg')`}}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', 
        backgroundColor: hexToRgba(themes[theme].sidebar.backgroundColor, hasImage ? 0.9 : 1) }}>
        <SidebarHeader collapsed={collapsed} />
        <div>
          <div style={{ display: 'flex', flexDirection: 'row', marginBottom: '8px' }}>
            <Typography variant="body1" fontWeight={600}
              style={{ opacity: collapsed ? 0 : 0.7, letterSpacing: '0.5px', marginLeft: '10px' }}>
              会话记录
            </Typography>
            <img src={'/addMessage1.png'} onClick={onNewChatClick}
              title="新建会话" style={{ cursor: 'pointer', marginLeft: '20px', width: '24px', height: '24px'}} />
          </div>
        </div>
        <div style={{overflowY: 'auto'}}>
            <Menu menuItemStyles={menuItemStyles} ref={menuRef} >
              {renderMenuItems(chatRecord)}
            </Menu>
        </div>
        <SidebarFooter isAdmin={isAdmin} collapsed={collapsed} username={userName} footerEvent={footerEvent} />
      </div>
      <Modal title="会话重命名" okText="确定" cancelText="取消" open={isModalOpen} 
        onOk={handleRenameModalOk} onCancel={handleRenameModalCancel}>
        <Input placeholder="新会话名称" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </Modal>
    </Sider>
  );
};
