import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import MainView from '@/views/xinma-capture/MainView.vue'
const routes = [
  {
    path: '/',
    name: 'index',
    component: MainView
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

//添加导航守卫
router.beforeEach((to, from, next) => {
  next()
})

export default router
