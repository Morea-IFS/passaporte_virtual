/*
|--------------------------------------------------------------------------
| Validator file
|--------------------------------------------------------------------------
|
| The validator file is used for configuring global transforms for VineJS.
| The transform below converts all VineJS date outputs from JavaScript
| Date objects to Luxon DateTime instances, so that validated dates are
| ready to use with Lucid models and other parts of the app that expect
| Luxon DateTime.
|
*/

import { DateTime } from 'luxon'
import vine, { SimpleMessagesProvider, VineDate } from '@vinejs/vine'

declare module '@vinejs/vine/types' {
  interface VineGlobalTransforms {
    date: DateTime
  }
}

VineDate.transform((value) => DateTime.fromJSDate(value))

/**
 * Mensagens de validação em português, exibidas direto na interface.
 */
vine.messagesProvider = new SimpleMessagesProvider(
  {
    'required': 'Campo obrigatório.',
    'string': '{{ field }} precisa ser um texto.',
    'boolean': '{{ field }} precisa ser sim ou não.',
    'email': 'Informe um e-mail válido.',
    'minLength': '{{ field }}: use pelo menos {{ min }} caracteres.',
    'maxLength': '{{ field }}: use no máximo {{ max }} caracteres.',
    'regex': '{{ field }} está em um formato inválido.',
    'enum': '{{ field }} inválido.',
    'date': '{{ field }}: informe uma data válida.',
    'date.afterOrSameAs': 'O término não pode ser antes do início.',
    'database.unique': '{{ field }} já está em uso.',
    'database.exists': '{{ field }}: escolha uma opção válida.',
    'number': '{{ field }}: escolha uma opção válida.',
    'file': '{{ field }} precisa ser um arquivo.',
    'file.size': '{{ field }}: o arquivo pode ter no máximo {{ size }}.',
    'file.extname': '{{ field }}: envie um arquivo {{ extnames }}.',
    'hashtag.regex': 'Use só letras, números e _ (ex.: #SNCT2026).',
    'nickname.regex': 'Use só letras sem acento, números, ponto, hífen ou _ (ex.: ana.estrela).',
    'nickname.database.unique': 'Esse apelido já está em uso. Tente outro.',
  },
  {
    name: 'Nome',
    startsOn: 'Início',
    endsOn: 'Término',
    location: 'Local',
    hashtag: 'Hashtag',
    description: 'Descrição',
    category: 'Categoria',
    categoryId: 'Categoria',
    moveToCategoryId: 'Categoria de destino',
    summary: 'Resumo',
    image: 'Imagem',
    logo: 'Logomarca',
    file: 'Arquivo',
    email: 'E-mail',
    nickname: 'Apelido',
    code: 'Código',
    password: 'Senha',
  }
)
