import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Menu, Input, Button, Card, Tag, Select, message, Modal, Form, Spin, Row, Col, Dropdown } from 'antd';
import { PlusOutlined, StarOutlined, StarFilled, EditOutlined, DeleteOutlined, CopyOutlined, EllipsisOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import './App.css';

const { Header, Content, Sider } = Layout;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const App = () => {
  // 状态管理
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [selectedTag, setSelectedTag] = useState('全部');
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [form] = Form.useForm();
  
  // 密码验证相关状态
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();
  const [pendingAction, setPendingAction] = useState(null);
  const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD;

  // 飞书多维表格API配置 - 从环境变量获取
  const APP_TOKEN = process.env.REACT_APP_FEISHU_APP_TOKEN;
  const TABLE_ID = process.env.REACT_APP_FEISHU_TABLE_ID;
  const APP_ID = process.env.REACT_APP_FEISHU_APP_ID;
  const APP_SECRET = process.env.REACT_APP_FEISHU_APP_SECRET;

  // 获取访问令牌
  const getTenantAccessToken = useCallback(async () => {
    try {
      // 根据环境选择不同的API路径前缀
      const apiPrefix = process.env.NODE_ENV === 'production' ? '/api' : '/api/proxy';
      const response = await axios.post(`${apiPrefix}/open-apis/auth/v3/tenant_access_token/internal`, {
        app_id: APP_ID,
        app_secret: APP_SECRET
      });
      return response.data.tenant_access_token;
    } catch (error) {
      console.error('获取访问令牌失败:', error);
      message.error('获取访问令牌失败');
      return null;
    }
  }, [APP_ID, APP_SECRET]);

  // 获取所有Prompts
  const fetchPrompts = useCallback(async () => {
    // 移除对loading状态的检查，确保初始加载能够执行
    setLoading(true);
    try {
      const token = await getTenantAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // 根据环境选择不同的API路径前缀
      const apiPrefix = process.env.NODE_ENV === 'production' ? '/api' : '/api/proxy';
      const response = await axios.get(`${apiPrefix}/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          page_size: 100
        }
      });

      if (response.data && response.data.data && response.data.data.items) {
        const fetchedPrompts = response.data.data.items.map(item => {
          const fields = item.fields;
          return {
            id: item.record_id,
            title: fields.title || '无标题',
            content: fields.content || '',
            category: fields.category || '',
            tags: fields.tags || [],
            favorite: fields.favorite === '是'
          };
        });

        // 提取所有分类和标签
        const allCategories = ['全部', ...new Set(fetchedPrompts.map(p => p.category).filter(Boolean))];
        const allTags = ['全部', ...new Set(fetchedPrompts.flatMap(p => p.tags).filter(Boolean))];
        
        // 批量更新状态，减少渲染次数
        setPrompts(fetchedPrompts);
        setCategories(allCategories);
        setTags(allTags);
      }
    } catch (error) {
      console.error('获取Prompts失败:', error);
      message.error('获取Prompts失败');
    } finally {
      setLoading(false);
    }
  }, [APP_TOKEN, TABLE_ID, getTenantAccessToken]);

  // 添加或更新Prompt
  const savePrompt = async (values) => {
    try {
      // 显示加载状态
      setLoading(true);
      
      const token = await getTenantAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const fields = {
        title: values.title,
        content: values.content,
        category: values.category,
        tags: values.tags,
        favorite: values.favorite ? '是' : '否'
      };

      if (editingPrompt) {
        // 更新现有Prompt
        const apiPrefix = process.env.NODE_ENV === 'production' ? '/api' : '/api/proxy';
        await axios.put(`${apiPrefix}/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records/${editingPrompt.id}`, {
          fields
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        message.success('Prompt更新成功');
      } else {
        // 创建新Prompt
        const apiPrefix = process.env.NODE_ENV === 'production' ? '/api' : '/api/proxy';
        await axios.post(`${apiPrefix}/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records`, {
          fields
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        message.success('Prompt添加成功');
      }

      // 关闭模态框并重置表单
      setIsModalVisible(false);
      form.resetFields();
      
      // 重新获取所有Prompts
      fetchPrompts();
    } catch (error) {
      console.error('保存Prompt失败:', error);
      message.error('保存Prompt失败');
      setLoading(false); // 出错时也要关闭加载状态
    }
  };

  // 删除Prompt
  const deletePrompt = async (id) => {
    const performDelete = async () => {
      try {
        setLoading(true); // 开始加载状态
        const token = await getTenantAccessToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const apiPrefix = process.env.NODE_ENV === 'production' ? '/api' : '/api/proxy';
        await axios.delete(`${apiPrefix}/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        message.success('Prompt删除成功');
        fetchPrompts();
      } catch (error) {
        console.error('删除Prompt失败:', error);
        message.error('删除Prompt失败');
        setLoading(false); // 出错时关闭加载状态
      }
    };
    
    // 需要密码验证
    showPasswordModal(performDelete, true); // 添加第二个参数表示必须验证密码
  };

  // 切换收藏状态
  const toggleFavorite = async (prompt) => {
    try {
      // 先在本地更新状态，提供即时反馈
      const newFavoriteStatus = !prompt.favorite;
      setPrompts(prompts.map(p => 
        p.id === prompt.id ? {...p, favorite: newFavoriteStatus} : p
      ));
      
      // 点击收藏时，重置分类和标签为全部
      setSelectedCategory('全部');
      setSelectedTag('全部');
      
      const token = await getTenantAccessToken();
      if (!token) return;
      
      const apiPrefix = process.env.NODE_ENV === 'production' ? '/api' : '/api/proxy';
      await axios.put(`${apiPrefix}/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records/${prompt.id}`, {
        fields: {
          favorite: newFavoriteStatus ? '是' : '否'
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      message.success(`${newFavoriteStatus ? '已添加到收藏' : '已从收藏中移除'}`);
    } catch (error) {
      console.error('切换收藏状态失败:', error);
      message.error('操作失败');
      // 如果API调用失败，恢复原始状态
      setPrompts(prompts.map(p => 
        p.id === prompt.id ? prompt : p
      ));
    }
  };

  // 复制Prompt内容到剪贴板
  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content)
      .then(() => message.success('已复制到剪贴板'))
      .catch(() => message.error('复制失败'));
  };
  
  // 创建Prompt副本
  const createPromptCopy = async (prompt) => {
    const performCopy = async () => {
      try {
        setLoading(true);
        const token = await getTenantAccessToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const fields = {
          title: `${prompt.title}副本`,
          content: prompt.content,
          category: prompt.category,
          tags: prompt.tags,
          favorite: prompt.favorite ? '是' : '否'
        };

        // 创建新Prompt
        const apiPrefix = process.env.NODE_ENV === 'production' ? '/api' : '/api/proxy';
        await axios.post(`${apiPrefix}/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${TABLE_ID}/records`, {
          fields
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        message.success('已创建Prompt副本');
        fetchPrompts();
      } catch (error) {
        console.error('创建Prompt副本失败:', error);
        message.error('创建副本失败');
        setLoading(false);
      }
    };
    
    // 需要密码验证
    showPasswordModal(performCopy, true); // 添加第二个参数表示必须验证密码
  };

  // 验证密码
  const verifyPassword = (password) => {
    return password === ADMIN_PASSWORD;
  };

  // 显示密码验证模态框
  const showPasswordModal = (action, requirePassword = false) => {
    setPendingAction(() => {
      return () => {
        // 如果不需要密码验证，或者已经验证过密码，直接执行操作
        if (action) {
          action();
        }
      };
    });
    
    // 如果不需要密码验证，直接执行操作并返回
    if (!requirePassword) {
      if (action) {
        action();
      }
      return;
    }
    
    // 需要密码验证，显示密码模态框
    passwordForm.resetFields();
    setIsPasswordModalVisible(true);
  };

  // 处理密码验证
  const handlePasswordVerification = () => {
    passwordForm.validateFields().then(values => {
      if (verifyPassword(values.password)) {
        setIsPasswordModalVisible(false);
        // 执行待处理的操作
        if (pendingAction) {
          pendingAction();
        }
      } else {
        message.error('密码错误，请重试');
      }
    }).catch(error => {
      console.log('验证失败:', error);
    });
  };
  
  // 打开添加/编辑模态框
  const showModal = (prompt = null) => {
    const openModal = () => {
      setEditingPrompt(prompt);
      if (prompt) {
        form.setFieldsValue({
          title: prompt.title,
          content: prompt.content,
          category: prompt.category,
          tags: prompt.tags,
          favorite: prompt.favorite
        });
      } else {
        form.resetFields();
      }
      setIsModalVisible(true);
    };
    
    // 需要密码验证
    showPasswordModal(openModal, true); // 添加第二个参数表示必须验证密码
  };

  // 处理分类点击
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  // 处理标签点击
  const handleTagClick = (tag) => {
    setSelectedTag(tag);
  };

  // 过滤Prompts
  const filteredPrompts = prompts.filter(prompt => {
    // 分类筛选
    if (selectedCategory !== '全部' && prompt.category !== selectedCategory) return false;
    
    // 标签筛选
    if (selectedTag !== '全部' && !prompt.tags.includes(selectedTag)) return false;
    
    // 收藏筛选
    if (showFavorites && !prompt.favorite) return false;
    
    // 搜索筛选 - 增强搜索功能，支持标题、内容、分类、标签
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const titleMatch = prompt.title.toLowerCase().includes(searchLower);
      const contentMatch = prompt.content.toLowerCase().includes(searchLower);
      const categoryMatch = prompt.category.toLowerCase().includes(searchLower);
      const tagsMatch = prompt.tags.some(tag => tag.toLowerCase().includes(searchLower));
      
      if (!titleMatch && !contentMatch && !categoryMatch && !tagsMatch) return false;
    }
    
    return true;
  });

  // 初始加载
  useEffect(() => {
    fetchPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 仅在组件挂载时执行一次

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="logo" style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>飞书Prompt管理工具</div>
      </Header>
      <Layout>
        <Sider width={250} className="site-sider">
          <div style={{ padding: '16px' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => showModal()} 
              style={{ width: '100%', marginBottom: '16px' }}
              disabled={loading} // 加载时禁用按钮
            >
              添加Prompt
            </Button>
            <Button 
              type={showFavorites ? "primary" : "default"}
              icon={showFavorites ? <StarFilled /> : <StarOutlined />}
              onClick={() => setShowFavorites(!showFavorites)}
              style={{ width: '100%', marginBottom: '16px' }}
              disabled={loading} // 加载时禁用按钮
            >
              {showFavorites ? '查看全部' : '只看收藏'}
            </Button>
          </div>
          <div style={{ padding: '0 16px 16px 16px' }}>
            <h3 style={{ marginBottom: '12px', color: '#fff' }}>分类</h3>
            <Menu
              mode="inline"
              selectedKeys={[selectedCategory]}
              onClick={({key}) => {
                setSelectedCategory(key);
                // 选择分类时，标签默认为全部
                if (selectedTag !== '全部') {
                  setSelectedTag('全部');
                }
              }}
              items={categories.map(category => ({
                key: category,
                label: category
              }))}
              style={{ background: '#141414', color: '#fff' }}
            />
          </div>
        </Sider>
        <Content style={{ padding: '20px', minHeight: 280, background: '#141414' }}>
          <div className="right-content">
            {/* 搜索栏 */}
            <div className="search-section" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
              <Row justify="center" style={{ width: '100%' }}>
                <Col span={20}>
                  <Search 
                    placeholder="搜索标题、内容、分类、标签" 
                    allowClear 
                    style={{ width: '100%' }} 
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </Col>
              </Row>
            </div>
            
            {/* 标签区域 */}
            <div className="tags-section" style={{ marginBottom: '20px', textAlign: 'center' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {tags.map(tag => (
                  <Tag 
                    key={tag} 
                    color={selectedTag === tag ? 'blue' : 'default'}
                    style={{ cursor: 'pointer', margin: '4px' }}
                    onClick={() => setSelectedTag(tag)}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
            
            {/* Prompt卡片区域 */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
              </div>
            ) : filteredPrompts.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                {filteredPrompts.map(prompt => (
                  <Card
                    key={prompt.id}
                    title={prompt.title}
                    extra={
                      <div>
                        <Button 
                          type="text" 
                          icon={prompt.favorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />} 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(prompt);
                          }}
                          style={{ marginRight: '4px' }}
                        />
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: 'copy',
                                icon: <CopyOutlined />,
                                label: '创建副本',
                                onClick: (e) => {
                                  e.domEvent.stopPropagation();
                                  createPromptCopy(prompt);
                                }
                              },
                              {
                                key: 'edit',
                                icon: <EditOutlined />,
                                label: '编辑',
                                onClick: (e) => {
                                  e.domEvent.stopPropagation();
                                  showModal(prompt);
                                }
                              },
                              {
                                key: 'delete',
                                icon: <DeleteOutlined />,
                                label: '删除',
                                onClick: (e) => {
                                  e.domEvent.stopPropagation();
                                  Modal.confirm({
                                    title: '确认删除',
                                    content: '确定要删除这个Prompt吗？此操作不可撤销。',
                                    onOk: () => deletePrompt(prompt.id)
                                  });
                                }
                              }
                            ]
                          }}
                          trigger={['click']}
                          placement="bottomRight"
                        >
                          <Button
                            type="text"
                            icon={<EllipsisOutlined />}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Dropdown>
                      </div>
                    }
                    onClick={() => copyToClipboard(prompt.content)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ marginBottom: '12px' }}>
                      {prompt.category && (
                        <Tag 
                          color="blue" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategoryClick(prompt.category);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {prompt.category}
                        </Tag>
                      )}
                      {prompt.tags && prompt.tags.map(tag => (
                        <Tag 
                          key={tag} 
                          color="green"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTagClick(tag);
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {tag}
                        </Tag>
                      ))}
                    </div>
                    <div style={{ height: '80px', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '8px' }}>
                      {prompt.content}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                没有找到匹配的Prompt
              </div>
            )}
          </div>
        </Content>
      </Layout>

      {/* 添加/编辑Prompt模态框 */}
      <Modal
        title={editingPrompt ? '编辑Prompt' : '添加Prompt'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={savePrompt}
          initialValues={{ favorite: false }}
        >
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="输入Prompt标题" />
          </Form.Item>
          
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={6} placeholder="输入Prompt内容" />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="分类"
          >
            <Select
              placeholder="选择分类"
              allowClear
              showSearch
              dropdownRender={menu => (
                <div>
                  {menu}
                  <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
                    <Input
                      style={{ flex: 'auto' }}
                      placeholder="输入新分类"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const value = e.target.value.trim();
                          if (value && !categories.includes(value)) {
                            setCategories([...categories, value]);
                            form.setFieldsValue({ category: value });
                          }
                          e.target.value = '';
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            >
              {categories.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="tags"
            label="标签"
          >
            <Select
              mode="multiple"
              placeholder="选择标签"
              allowClear
              dropdownRender={menu => (
                <div>
                  {menu}
                  <div style={{ display: 'flex', flexWrap: 'nowrap', padding: 8 }}>
                    <Input
                      style={{ flex: 'auto' }}
                      placeholder="输入新标签"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const value = e.target.value.trim();
                          if (value && !tags.includes(value)) {
                            setTags([...tags, value]);
                            const currentTags = form.getFieldValue('tags') || [];
                            form.setFieldsValue({ tags: [...currentTags, value] });
                          }
                          e.target.value = '';
                          e.preventDefault();
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            >
              {tags.map(tag => (
                <Option key={tag} value={tag}>{tag}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="favorite" valuePropName="checked">
            <Button 
              type="text" 
              icon={<StarOutlined />} 
              onClick={() => {
                const currentValue = form.getFieldValue('favorite');
                form.setFieldsValue({ favorite: !currentValue });
              }}
            >
              {form.getFieldValue('favorite') ? '取消收藏' : '添加到收藏'}
            </Button>
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => setIsModalVisible(false)}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 密码验证模态框 */}
      <Modal
        title="管理员验证"
        open={isPasswordModalVisible}
        onCancel={() => setIsPasswordModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsPasswordModalVisible(false)}>
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={handlePasswordVerification}>
            确认
          </Button>
        ]}
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            name="password"
            label="请输入管理密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />}
              placeholder="请输入管理密码" 
              autoComplete="off"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default App;