<template>
  <div>
    <!-- Page Header -->
    <section class="section-sm bg-light" aria-labelledby="contact-title">
      <div class="container">
        <h1 id="contact-title">聯絡我們</h1>
        <p class="text-muted">請填寫以下表單，我們將盡快回覆您</p>
      </div>
    </section>

    <!-- Contact Form -->
    <section class="section">
      <div class="container">
        <div class="grid grid-cols-2">
          <!-- Form -->
          <div class="card">
            <div class="card-body">
              <form @submit.prevent="handleSubmit" novalidate>
                <div class="form-group">
                  <label for="name" class="form-label">姓名 *</label>
                  <input 
                    id="name"
                    v-model="form.name"
                    type="text"
                    class="form-input"
                    placeholder="請輸入您的姓名"
                    required
                    aria-required="true"
                  />
                </div>

                <div class="form-group">
                  <label for="company" class="form-label">公司</label>
                  <input 
                    id="company"
                    v-model="form.company"
                    type="text"
                    class="form-input"
                    placeholder="請輸入公司名稱"
                  />
                </div>

                <div class="form-group">
                  <label for="email" class="form-label">Email *</label>
                  <input 
                    id="email"
                    v-model="form.email"
                    type="email"
                    class="form-input"
                    placeholder="請輸入您的 Email"
                    required
                    aria-required="true"
                  />
                </div>

                <div class="form-group">
                  <label for="type" class="form-label">洽詢類型</label>
                  <select id="type" v-model="form.type" class="form-select">
                    <option value="">請選擇</option>
                    <option value="farms">牧場與酪農</option>
                    <option value="food">食品品牌</option>
                    <option value="scope3">企業 Scope 3</option>
                    <option value="research">政府與研究</option>
                    <option value="investor">投資人</option>
                    <option value="other">其他</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="message" class="form-label">訊息 *</label>
                  <textarea 
                    id="message"
                    v-model="form.message"
                    class="form-textarea"
                    placeholder="請輸入您的訊息"
                    required
                    aria-required="true"
                  ></textarea>
                </div>

                <button type="submit" class="btn btn-primary btn-lg w-full">
                  送出
                </button>
              </form>
            </div>
          </div>

          <!-- Contact Info -->
          <div>
            <h3>聯絡資訊</h3>
            <div class="card" style="margin-top: 1rem;">
              <div class="card-body">
                <h4>Email</h4>
                <p>info@hsu-kc.com</p>
                <h4>電話</h4>
                <p>+886 2 1234 5678</p>
                <h4>地址</h4>
                <p>台北市信義區信義路五段7號</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const form = reactive({
  name: '',
  company: '',
  email: '',
  type: '',
  message: ''
})

function handleSubmit() {
  alert('表單已送出！我們將盡快與您聯繫。')
}
</script>