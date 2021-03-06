import React, { Component } from 'react'
import { graphql, compose } from 'react-apollo'
import gql from 'graphql-tag'
import { Modal, Form, Icon, Button, Label, Message } from 'semantic-ui-react';

import styled from 'styled-components'
import { upsertProd } from '../graphql/prod'
import { deptFragment } from '../graphql/dept'
import { Div } from './shared/styled-semantic';

const allDeptsAndModelsQuery = gql`
  query allDeptsAndModelsQuery {
    depts {
      id
      name
    }
    models {
      id
      name
    }
  }
`

const EqualField = styled.div`
  margin: 0 5px 1em 5px;
  flex: 1 0 150px;
`

class CRUProdModal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      open: false,
      deptId: '',
      modelId: '',
      melt: '',
      meltShift: '',
      number: '',
      year: '',
      progress: '',
      hasDefect: false,
      isSpoiled: false,
      deptIdErr: false,
      modelIdErr: false,
      meltErr: false,
      meltShiftErr: false,
      numberErr: false,
      yearErr: false,
      progressErr: false,
      err: null
    }
    if (props.mode === 'edit') {
      this.state = {
        ...this.state,
        ...props.prod
      }
      // replace nulls with '' for React controlled components to work
      for(let k in this.state) {(this.state[k] === null) && (this.state[k] = '')}
    }
  }
  open = () => this.setState({ open: true })
  close = () => this.setState({ open: false })
  handleSelChange = (event, {name, value, required}) => {
    //style input as warning if value is not appropriate
    const warn = (value === '' && required) ? true : false
    this.setState({
      [name]: value,
      [`${name}Err`]: warn
    })
    console.log(`Selected: ${ value}`)
  }
  handleIntChange = (event, {name, value, min, max, required}) => {
    //in case of an error keep empty string for React controlled component
    const intValue = parseInt(value, 10) || (parseInt(value, 10) === 0 ? 0 : '')
    //style input as warning if value is not appropriate
    const warn = (intValue === '' && !required) ? false : (intValue < min || max < intValue)
    this.setState({
      [name]: intValue,
      [`${name}Err`]: warn
    })
  }
  changeStatus = (e, {name}) => {
    e.preventDefault()
    e.stopPropagation()
    const curVal = this.state[name]
    // reset statuses
    this.setState({
      hasDefect: false,
      isSpoiled: false
    })
    // if supposed, activate status
    if (!curVal) {
      this.setState({ [name]: true })
    }
  }
  confirm = async () => {
    const mode = this.props.mode
    //VALIDATION
    const requiredFields = (mode === 'create') ?
      ['deptId', 'modelId', 'melt', 'number', 'year'] :
      ['melt', 'number', 'year']
    let shouldExit = false
    //check for empty required fields and setting corresponding errors
    // @ts-ignore
    this.setState(Object.assign(...requiredFields.map(field => {
      if (this.state[field] === '') {
        shouldExit = true
        return ({[`${field}Err`]: true})
      }
      return false
    })))
    //check for other Form errors
    requiredFields.forEach((field) => {
      if (this.state[`${field}Err`]) { shouldExit = true }
    })
    //terminate if validation failed
    if (shouldExit) {return null}
    const { id, deptId, modelId, melt, number, year } = this.state
    const meltShift = this.state.meltShift || null
    const progress = this.state.progress || null
    const hasDefect = this.state.hasDefect || null
    const isSpoiled = this.state.isSpoiled || null
    const input = {
      deptId,
      modelId,
      melt,
      meltShift,
      number,
      year,
      progress,
      hasDefect,
      isSpoiled
    }
    if (mode === 'edit') input.id = id
    try {
      await this.props.upsertProd({
        variables: {
          input: { ...input }
        }
      })
      this.setState({ err: null })
      this.close()
    } catch (err) {
      console.log('err > ', err)
      this.setState({ err })
    }
  }
  render() {
    const { open, deptId, modelId, melt, meltShift, number, year, progress, hasDefect, isSpoiled, deptIdErr, modelIdErr, meltErr, meltShiftErr, numberErr, yearErr, progressErr, err } = this.state
    const { trigger, mode } = this.props
    let deptOptions = [{ text: 'Участок ', value: '' }]
    let modelOptions = [{ text: 'Вид продукции', value: '' }]
    if (mode === 'create') {
      const query = this.props.allDeptsAndModelsQuery
      deptOptions = !query ? [ { text: 'Участок ', value: '' } ] :
        query.loading ? [ { text: 'Загрузка списка', value: '' } ] :
        query.error ? [ { text: 'Ошибка загрузки списка', value: '' } ] :
        query.depts.map(dept => ({
          text: dept.name,
          value:  dept.id
        })).sort((a, b) => a.text > b.text ? 1 : -1)
      modelOptions = !query ? [ { text: 'Вид продукции', value: '' } ] :
      query.loading ? [ { text: 'Загрузка списка', value: '' } ] :
      query.error ? [ { text: 'Ошибка загрузки списка', value: '' } ] :
      query.models.map(model => {
        return {
          text: model.name,
          value:  model.id
        }
      })
    } else if (mode === 'edit') {

    }
    return (
      <Modal
        trigger = { trigger }
        open={open}
        onOpen={this.open}
        onClose={this.close}
      >
        <Modal.Header as='h2'>{mode === 'create' ? 'Добавить' : 'Редактировать'} продукцию </Modal.Header>
        <Modal.Content>
          <Form onSubmit={() => this.confirm()} error={!!(err && err.message)}>
            { (mode === 'create') &&
              <Form.Select label='Участок' name='deptId' options={deptOptions} 
                onChange={this.handleSelChange} value={deptId} error={deptIdErr} required 
                search noResultsMessage='Ничего не найдено..'
              />
            }
            { (mode === 'create') &&
              <Form.Select label='Вид продукции' name='modelId' options={modelOptions} onChange={this.handleSelChange} 
                value={modelId} error={modelIdErr} required search noResultsMessage='Ничего не найдено..'/>
            }
            <Div
              d='flex'
              jc='stretch'
              ai='flex-end'
              flw='wrap'
              m='0 -5px'
            >
              <EqualField>
                <Form.Input label='Плавка' placeholder='Плавка' required
                  name='melt' type='number' min='0' max='999' error={meltErr}
                  onChange={this.handleIntChange} value={melt}/>
              </EqualField>
              <EqualField>
                <Form.Input label='Плав. смена (если промаркирована)' placeholder='Пл. смена'
                  name='meltShift' type='number' min='0' max='3' error={meltShiftErr}
                  onChange={this.handleIntChange} value={meltShift}/>
              </EqualField>
              <EqualField>
                <Form.Input label='Номер' placeholder='Номер' required
                  name='number' type='number' min='1' max='999' error={numberErr}
                  onChange={this.handleIntChange} value={number}/>
              </EqualField>
              <EqualField>
                <Form.Input label='Год' placeholder='Год' required
                  name='year' type='number' min='16' max={new Date().getFullYear().toString().slice(2,4)} error={yearErr}
                  onChange={this.handleIntChange} value={year}/>
              </EqualField>
            </Div>
            <Form.Input label='Процент завершения' placeholder='%'
              name='progress' type='number' min='0' max='100' error={progressErr}
              onChange={this.handleIntChange} value={progress}/>
            <Form.Field>
              <label>Наличие дефектов</label>
              <Button.Group>
                <Button name='hasDefect'
                  active={hasDefect || null}
                  color={hasDefect ? 'orange' : null}
                  onClick={this.changeStatus}
                >Отклонение</Button>
                <Button name='isSpoiled'
                  active={isSpoiled || null}
                  color={isSpoiled ? 'red' : null}
                  onClick={this.changeStatus}
                >Брак</Button>
              </Button.Group>
            </Form.Field>
            <Message
              error
              header={`${mode === 'create' ? 'Добавить' : 'Сохранить'} не удалось..`}
              content={err && err.message}
            />
          </Form>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.close} color='red'>
            <Icon name='remove' /> Отмена
          </Button>
          <Button onClick={this.confirm}>
            <Icon name='checkmark' /> {mode === 'create' ? 'Добавить' : 'Сохранить'}
          </Button>
        </Modal.Actions>
      </Modal>
    )
  }
}

export default compose(
  graphql(allDeptsAndModelsQuery, { name: 'allDeptsAndModelsQuery' }),
  graphql(upsertProd, {
    name: 'upsertProd',
    options: {
      update: (cache, {data: reponseData}) => {
				const newProd = reponseData.upsertProd
				// @ts-ignore
				const id = `Dept:${newProd.dept.id}`
				const fragment = deptFragment
				let data = cache.readFragment({
					id,
					fragment
        })
        delete newProd.dept
        if (!data.prods) data.prods = []
				data.prods = [...data.prods.filter(p => p.id !== newProd.id), newProd]
				cache.writeFragment({
					id,
					fragment,
					data
				})
			},
      // refetchQueries: ['allDepts']
    }
  }),
)(CRUProdModal)
