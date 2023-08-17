import styled from '@emotion/styled';
import React from 'react';
import { Typography } from './Typography';
import { ChromeOutlined, LogoutOutlined, SettingOutlined, SketchOutlined, UserAddOutlined, UserOutlined } from '@ant-design/icons';
import { Col, Dropdown, Input, InputNumber, MenuProps, Modal, Row, Select, Slider, Space, Tooltip, message } from 'antd';
import { createUser, getConfig, setConfig, updatePassword } from '../services/port';
import { deleteCookie } from '../utils/cookie';

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  collapsed?: boolean;
  username?: string;
  isAdmin?: boolean;
  footerEvent?: (key: string, value: any)  => Promise<any>;
}

// OpenAI参数配置
interface Configuration {
	// GPT apikey
	ApiKey: string;
	// openai提供的接口 空字符串使用默认接口
	ApiURL: string;
	// 服务端口
	Port: number;
	// 监听接口
	Listen: string;
	// AI特征
	BotDesc: string;
	// 代理
	Proxy: string;
	// GPT请求最大字符数
	MaxTokens: number;
	// GPT模型
	Model: string;
	// 控制模型生成文本时的创造性和多样性，较低的Temperature会使生成结果较为保守、较高的Temperature则会使结果更具创新性
	Temperature: number;
  // 控制模型生成时，筛选出概率最高的几个词，以此进行随机选择文本接续的方式，提高文本生成的可读性
	TopP: number;
  // 在生成文本时惩罚过于频繁的词语或短语，以避免生成过于重复的内容
	PresencePenalty: number;
  // 在生成文本时惩罚过于频繁出现的单词，以避免生成过于单一的内容
	FrequencyPenalty: number;
}

const StyledLink = styled.a`
  padding: 5px 16px;
  cursor: pointer;
  color: white;
  text-decoration: underline;
  font-size: 11pt;
`;

const StyledSidebarFooter = styled.div`
  width: 70%;
  display: flex;
  flex-direction: row;
  flex-wrap: noWrap;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 8px;
  color: white;
  background: linear-gradient(45deg, rgb(21 87 205) 0%, rgb(90 225 255) 100%);
`;

const StyledCollapsedSidebarFooter = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  color: white;
  background: linear-gradient(45deg, rgb(21 87 205) 0%, rgb(90 225 255) 100%);
`;

const modalInputStyle: React.CSSProperties = {
  width: '100%',
  margin: '5px 0px 5px 0px',
}

const modalSliderStyle: React.CSSProperties = {
  width: '100%',
  margin: '20px 0px 20px 0px',
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ children, collapsed, username, isAdmin, footerEvent, ...rest }) => {
  const [updatePwdForm] = React.useState({name: '', oldPwd: '', newPwd: '', confirmPwd: ''});
  const [configForm] = React.useState<Configuration>({ApiKey: '', ApiURL: '', Port: 0, Listen: '', BotDesc: '', Proxy: '', MaxTokens: 0, Model: '', Temperature: 0, TopP: 0, PresencePenalty: 0, FrequencyPenalty: 0});
  const [messageApi, contextHolder] = message.useMessage();
  const { TextArea } = Input;

  const items: MenuProps['items'] = [
    { label: '修改密码', key: 'UpdatePassword', icon: <SketchOutlined /> },
    { label: '退出登录', key: 'Logout', icon: <LogoutOutlined /> },
  ];
  if (isAdmin) {
    items.splice(0, 0, 
      { label: '系统设置', key: 'Setting', icon: <SettingOutlined /> },
      { label: '新增用户', key: 'AddUser', icon: <UserAddOutlined /> }, 
      { label: '重置密码', key: 'ResetPassword', icon: <ChromeOutlined />, title: '重置其他用户的密码'},
      { type: 'divider'},
    );
  }

  const handleInputChange = (event: any) => {
    const { name, value } = event.target;
    switch (name) {
      case 'name':
        updatePwdForm.name = value;
        break
      case 'oldPwd':
        updatePwdForm.oldPwd = value;
        break
      case 'newPwd':
        updatePwdForm.newPwd = value;
        break
      case 'confirmPwd':
        updatePwdForm.confirmPwd = value;
        break
      default:
        break
    }
  };

  const handleConfigChange = (event: any) => {
    const { name, value } = event.target;
    switch (name) {
      case 'ApiKey':
        configForm.ApiKey = value;
        break
      case 'ApiURL':
        configForm.ApiURL = value;
        break
      case 'Port':
        configForm.Port = Number(value);
        break
      case 'Listen':
        configForm.Listen = value;
        break
      case 'BotDesc':
        configForm.BotDesc = value;
        break
      case 'Proxy':
        configForm.Proxy = value;
        break
      case 'MaxTokens':
        configForm.MaxTokens = Number(value);
        break
      case 'Model':
        configForm.Model = value;
        break
      case 'Temperature':
        configForm.Temperature = Number(value);
        break
      case 'TopP':
        configForm.TopP = Number(value);
        break
      case 'PresencePenalty':
        configForm.PresencePenalty = Number(value);
        break
      case 'FrequencyPenalty':
        configForm.FrequencyPenalty = Number(value);
        break
      default:
        break
    }
  };

  const modalUpdatePwd = () => Modal.confirm({
    title: '用户密码修改',
    icon: <SketchOutlined />,
    content: (
      <Space direction="vertical">
        <Space direction="horizontal">
          <Typography>当前密码</Typography>
          <Input type="password" id="oldPwd" name="oldPwd" title="请输入您的原始密码" onChange={(e) => handleInputChange(e)} />
        </Space>
        <Space direction="horizontal">
          <Typography>新设密码</Typography>
          <Input type="password" id="newPwd" name="newPwd" title="请输入您准备设置的新密码" onChange={(e) => handleInputChange(e)} />
        </Space>
        <Space direction="horizontal">
          <Typography>确认密码</Typography>
          <Input type="password" id="confirmPwd" name="confirmPwd" title="请再次输入您准备设置的新密码" onChange={(e) => handleInputChange(e)} />
        </Space>
      </Space>
    ),
    okText: '确认',
    cancelText: '取消',
    onOk(close) {
      if (updatePwdForm.oldPwd === '' || updatePwdForm.newPwd === '' || updatePwdForm.confirmPwd === '') {
        messageApi.error('密码不能为空，请重新输入！')
      } else if (updatePwdForm.newPwd !== updatePwdForm.confirmPwd) {
        messageApi.error('新设密码和确认密码不一致，请重新输入！')
      } else {
        updatePassword(updatePwdForm.name, updatePwdForm.oldPwd, updatePwdForm.newPwd).then((res) => {
          if (res.data.code === 200) {
            messageApi.success('密码修改成功')
            close()
          } else {
            messageApi.error('密码修改失败，' + res.data.errorMsg, 5)
          }
        })
      }
    },
  })

  const modalResetPwd = () => Modal.confirm({
    title: '重置其他用户密码',
    icon: <ChromeOutlined />,
    content: (
      <Space direction="vertical">
        <Space direction="horizontal">
          <Typography>重置用户</Typography>
          <Input type="text" id="name" name="name" title="请输入需要重置密码的用户" onChange={(e) => handleInputChange(e)} />
        </Space>
        <Space direction="horizontal">
          <Typography>新设密码</Typography>
          <Input type="password" id="newPwd" name="newPwd" title="请输入您准备设置的新密码" onChange={(e) => handleInputChange(e)} />
        </Space>
        <Space direction="horizontal">
          <Typography>确认密码</Typography>
          <Input type="password" id="confirmPwd" name="confirmPwd" title="请再次输入您准备设置的新密码" onChange={(e) => handleInputChange(e)} />
        </Space>
      </Space>
    ),
    okText: '确认',
    cancelText: '取消',
    onOk(close) {
      if (updatePwdForm.name === '' || updatePwdForm.newPwd === '' || updatePwdForm.confirmPwd === '') {
        messageApi.error('用户或密码不能为空，请重新输入！')
      } else if (updatePwdForm.newPwd !== updatePwdForm.confirmPwd) {
        messageApi.error('新设密码和确认密码不一致，请重新输入！')
      } else {
        updatePassword(updatePwdForm.name, updatePwdForm.oldPwd, updatePwdForm.newPwd).then((res) => {
          if (res.data.code === 200) {
            messageApi.success('密码修改成功')
            close()
          } else {
            messageApi.error('密码修改失败，' + res.data.errorMsg, 5)
          }
        })
      }
    },
  })

  const modalAddUser = () => Modal.confirm({
    title: '新用户注册',
    icon: <UserAddOutlined />,
    content: (
      <Space direction="vertical">
        <Space direction="horizontal">
          <Typography>用户名称</Typography>
          <Input type="text" id="name" name="name" title="请输入新用户名称，最好英文" onChange={(e) => handleInputChange(e)} />
        </Space>
        <Space direction="horizontal">
          <Typography>用户密码</Typography>
          <Input type="password" id="newPwd" name="newPwd" title="请输入新用户登录密码" onChange={(e) => handleInputChange(e)} />
        </Space>
        <Space direction="horizontal">
          <Typography>确认密码</Typography>
          <Input type="password" id="confirmPwd" name="confirmPwd" title="请再次输入新用户登录密码" onChange={(e) => handleInputChange(e)} />
        </Space>
      </Space>
    ),
    okText: '确认',
    cancelText: '取消',
    onOk(close) {
      if (updatePwdForm.name === '' || updatePwdForm.newPwd === '' || updatePwdForm.confirmPwd === '') {
        messageApi.error('用户或密码不能为空，请重新输入！')
      } else if (updatePwdForm.newPwd !== updatePwdForm.confirmPwd) {
        messageApi.error('用户密码和确认密码不一致，请重新输入！')
      } else {
        createUser(updatePwdForm.name, updatePwdForm.newPwd).then((res) => {
          if (res.data.code === 200) {
            messageApi.success('新用户【' + updatePwdForm.name + '】创建成功')
            close()
          } else {
            messageApi.error('创建用户失败，' + res.data.errorMsg, 5)
          }
        })
      }
    },
  })

  const modalSetConfig = (config: Configuration) => Modal.confirm({
    title: '参数配置',
    icon: <SettingOutlined />,
    width: 800,
    content: (
      <>
        <Row align='middle'>
          <Col span={2}>API地址</Col>
          <Col span={22}>
            <Input type="text" id="ApiURL" name="ApiURL" defaultValue={config.ApiURL} 
              style={modalInputStyle} onChange={(e) => handleConfigChange(e)}
              title="AI接口地址，空白使用默认OpenAi接口" placeholder="AI接口地址，空白使用默认OpenAi接口"/>
          </Col>
        </Row>
        <Row align='middle'>
          <Col span={2}>API密钥</Col>
          <Col span={22}>
            <Input type="text" id="ApiKey" name="ApiKey" defaultValue={config.ApiKey}
              style={modalInputStyle}  onChange={(e) => handleConfigChange(e)}
              title="AI调用接口的密钥" placeholder="AI调用接口的密钥" />
          </Col>
        </Row>
        <Row align='middle'>
          <Col span={2}>代理地址</Col>
          <Col span={22}>
            <Input type="text" id="Proxy" name="Proxy" defaultValue={config.Proxy}
              style={modalInputStyle}  onChange={(e) => handleConfigChange(e)}
              title="调用OpenAI接口使用的代理地址" placeholder="调用OpenAI接口使用的代理地址" />
          </Col>
        </Row>
        <Row align='middle'>
          <Col span={2}>监听地址</Col>
          <Col span={12}>
            <Input type="text" id="Listen" name="Listen" defaultValue={config.Listen}
              style={modalInputStyle}  onChange={(e) => handleConfigChange(e)}
              title="后端服务监听地址，默认0.0.0.0" placeholder="后端服务监听地址，默认0.0.0.0" />
          </Col>
          <Col span={2} offset={1}>服务端口</Col>
          <Col span={7}>
            <Input type="text" id="Port" name="Port" defaultValue={config.Port}
              style={modalInputStyle}  onChange={(e) => handleConfigChange(e)}
              title="后端服务端口号" placeholder="后端服务端口号" />
          </Col>
        </Row>
        <Row align='middle'>
          <Col span={2}>GPT模型</Col>
          <Col span={12}>
            <Select id="Model" defaultValue={config.Model}
              style={modalInputStyle} onChange={(e) => configForm.Model = e}>
              <Select.Option value="gpt-3.5-turbo">gpt-3.5-turbo</Select.Option>
              <Select.Option value="gpt-3.5-turbo-16k">gpt-3.5-turbo-16k</Select.Option>
              <Select.Option value="gpt-3.5-turbo-0613">gpt-3.5-turbo-0613</Select.Option>
              <Select.Option value="text-davinci-003">text-davinci-003</Select.Option>
              <Select.Option value="text-davinci-002">text-davinci-002</Select.Option>
              <Select.Option value="code-davinci-002">code-davinci-002</Select.Option>
              <Select.Option value="gpt-4">gpt-4</Select.Option>
              <Select.Option value="gpt-4-0613">gpt-4-0613</Select.Option>
              <Select.Option value="gpt-4-32k">gpt-4-32k</Select.Option>
            </Select>
          </Col>
          <Col span={2} offset={1}>Tokens数</Col>
          <Col span={7}>
            <Input type="text" id="MaxTokens" name="MaxTokens" defaultValue={config.MaxTokens}
              style={modalInputStyle}  onChange={(e) => handleConfigChange(e)}
              title="最大的tokens数" placeholder="最大的tokens数" />
          </Col>
        </Row>
        <Row align='middle'>
          <Col span={2}>
            <Tooltip title="使用什么采样热度，介于 0 和 2 之间。较高的值（如 0.8）将使输出更加随机，而较低的值（如 0.2）将使其更加集中和确定。建议更改此或TopP(核心采样)，但不要同时更改两者">
            采样热度
            </Tooltip>
          </Col>
          <Col span={10}>
            <Slider id="Temperature" min={0} max={2} step={0.1} defaultValue={config.Temperature}
              style={modalSliderStyle} onChange={(e) => configForm.Temperature = e} />
          </Col>
          <Col span={2} offset={1}>
            <Tooltip title="采样热度的替代方法称为核心采样，其中模型考虑具有TopP概率质量的标记的结果。因此 0.1 表示仅考虑包含前 10% 概率质量的标记。建议更改此或采样热度，但不要同时更改两者">
            核心采样
            </Tooltip>
          </Col>
          <Col span={9}>
            <Slider id="TopP" min={0} max={1} step={0.1} defaultValue={config.TopP}
              style={modalSliderStyle} onChange={(e) => configForm.TopP = e} />
          </Col>
        </Row>
        <Row align='middle'>
          <Col span={2}>
            <Tooltip title="它的作用是惩罚原始文本中已经出现过的单词/短语，从而鼓励生成无重复的输出。这个参数是在生成句子的时候加入惩罚项来限制重复单词的，如果输出的文章不能包含与输入段落中已有的单词相同的单词，则会影响最终的输出。它的值可以是 0 到 1，其中 0 表示没有惩罚，1 表示完全禁止模型复制输入段落中出现的单词或短语">
            防重惩罚
            </Tooltip>
          </Col>
          <Col span={10}>
            <Slider id="PresencePenalty" min={-2} max={2} step={0.1} defaultValue={config.PresencePenalty}
              style={modalSliderStyle} onChange={(e) => configForm.PresencePenalty = e} />
          </Col>
          <Col span={2} offset={1}>
            <Tooltip title="作用类似于防重惩罚，但不是惩罚已经出现过的单词/短语，而是减少总体上使用频率较高的单词/短语的概率，增加使用频率较低的单词/短语的可能性。与presence_penalty值的范围相同，其中0表示没有惩罚，1表示使用频率高的单词/短语完全不允许出现">
            词频惩罚
            </Tooltip>
          </Col>
          <Col span={9}>
            <Slider id="FrequencyPenalty" min={-2} max={2} step={0.1} defaultValue={config.FrequencyPenalty}
              style={modalSliderStyle} onChange={(e) => configForm.FrequencyPenalty = e} />
          </Col>
        </Row>
        <Row align='middle'>
          <Col span={2}>AI特征</Col>
          <Col span={22}>
            <TextArea id="BotDesc" name="BotDesc" defaultValue={config.BotDesc} rows={3}
              style={modalInputStyle} onChange={(e) => handleConfigChange(e)}
              title="AI助理的特征描述" placeholder="AI助理的特征描述" />
          </Col>
        </Row>
      </>
    ),
    okText: '确认',
    cancelText: '取消',
    onOk(close) {
      setConfig(configForm).then((res) => {
        if (res.data.code === 200) {
          messageApi.success('系统配置保存成功')
          close()
        } else {
          messageApi.error('配置保存失败，' + res.data.errorMsg, 5)
        }
      })
    },
  })

  const onClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'UpdatePassword':
        modalUpdatePwd();
        break
      case 'ResetPassword':
        modalResetPwd();
        break
      case 'Logout':
        deleteCookie('mojolicious')
        window.location.href = '/'
        break
      case 'Setting':
        getConfig().then((res) => {
          configForm.ApiKey = res.data.data.ApiKey;
          configForm.ApiURL = res.data.data.ApiURL;
          configForm.Port = Number(res.data.data.Port);
          configForm.Listen = res.data.data.Listen;
          configForm.BotDesc = res.data.data.BotDesc;
          configForm.Proxy = res.data.data.Proxy;
          configForm.MaxTokens = Number(res.data.data.MaxTokens);
          configForm.Model = res.data.data.Model;
          configForm.Temperature = Number(res.data.data.Temperature);
          configForm.TopP = Number(res.data.data.TopP);
          configForm.PresencePenalty = Number(res.data.data.PresencePenalty);
          configForm.FrequencyPenalty = Number(res.data.data.FrequencyPenalty);
          modalSetConfig(configForm);
        })
        break
      case 'AddUser':
        modalAddUser();
        break
      default:
        break
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px', marginBottom: '12px'}}>
      {collapsed ? (
        <StyledCollapsedSidebarFooter {...rest}>
          <img src={'/person.jpg'} style={{ width: '24px', height: '24px'}} />
        </StyledCollapsedSidebarFooter>
      ) : (
        <StyledSidebarFooter {...rest}>
          <Dropdown menu={{ items, onClick }} trigger={['click']}>
            <StyledLink onClick={(e) => e.preventDefault()}>
              <Space>
                <UserOutlined />{username}
              </Space>
            </StyledLink>
          </Dropdown>
        </StyledSidebarFooter>
      )}
      {contextHolder}
    </div>
  );
};
