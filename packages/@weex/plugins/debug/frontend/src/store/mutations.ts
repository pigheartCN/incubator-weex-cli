/* Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { Commit, MutationTree } from 'vuex'

import * as types from './mutation-types'
import { State } from './index'

const mutations: MutationTree<State> = {
  [types.UPDATE_CHANNEL_ID] (state: State, value: string) {
    state.channelId = value
  },
  [types.UPDATE_ENVIRONMENT_SETTING] (state: State, value: boolean) {
    state.environmentSetting = value
  },
  [types.UPDATE_HELP_SETTING] (state: State, value: boolean) {
    state.helpSetting = value
  },
  [types.UPDATE_BUNDLE_SETTING] (state: State, value: boolean) {
    state.bundleSetting = value
  }
}

export default mutations
