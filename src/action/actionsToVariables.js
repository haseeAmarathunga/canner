// @flow
import type {Action, ActionType} from './types';
import merge from 'lodash/merge';
import update from 'lodash/update';
import set from 'lodash/set';

export default function actionsToVariables(actions: Array<Action<ActionType>>) {
  const variables = {payload: {}, where: {}};
  actions.forEach(action => {
    let {path = '', value, id, relation} = action.payload;
    switch(action.type) {
      case 'CREATE_ARRAY': {
        // quick fix, remove null relation, it will cause apollo break
        const ensureValue = value.filter((v, k) => v !== null && k !== '__typename');
        merge(variables.payload, (ensureValue && ensureValue.toJS) ? ensureValue.toJS() : ensureValue);
        break;
      }
      case 'UPDATE_ARRAY':
      case 'UPDATE_OBJECT':
        merge(variables.payload, (value && value.toJS) ? value.toJS() : value);
        merge(variables.where, {id});
        break;
      case 'CONNECT': {
        if (relation && relation.type === 'toMany') {
          update(variables.payload, path.split('/').concat('connect'), arr => (arr || []).concat({id: value.get('id')}));
        } else {
          set(variables.payload, path.split('/').concat('connect'), {id: value.get('id')});
        }
        if (id) {
          merge(variables.where, {id});
        }
        break;
      }
      case 'CREATE_AND_CONNECT': {
        if (relation && relation.type === 'toMany') {
          update(variables.payload, path.split('/').concat('create'), arr => (arr || []).concat(value.toJS()));
        } else {
          set(variables.payload, path.split('/').concat('create'), value.toJS());
        }
        merge(variables.where, {id});
        break;
      }
      case 'DISCONNECT':
        if (relation && relation.type === 'toMany') {
          update(variables.payload, path.split('/').concat('disconnect'), arr => (arr || []).concat({id: value.get('id')}));
        } else {
          set(variables.payload, path.split('/').concat('disconnect'), {id: value.get('id')});
        }
        if (id) {
          merge(variables.where, {id});
        }
        break;
      case 'DISCONNECT_AND_DELETE':
        if (relation && relation.type === 'toMany') {
          update(variables.payload, path.split('/').concat('delete'), arr => (arr || []).concat(value.toJS()));
        } else {
          set(variables.payload, path.split('/').concat('delete'), value.toJS());
        }
        merge(variables.where, {id});
        break;
      case 'DELETE_ARRAY':
        merge(variables.where, {id});
        break;
      default:
        break;
    }
  });
  return variables;
}