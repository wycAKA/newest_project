import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { storage } from './storage/resource'; // 追記

defineBackend({
  auth,
  data,
  storage, // 追記
});