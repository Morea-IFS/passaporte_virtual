import { VisitorShell } from '@/components/passport/visitor-shell'
import { BackLink } from '@/components/ui/back-link'

export default function PrivacyPage() {
  return (
    <VisitorShell homeHref="/">
      <BackLink href="/" label="Voltar ao início" />
      <h1 className="text-3xl font-black text-accent">Seus dados no passaporte</h1>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">O que guardamos</h2>
        <p>
          Seu apelido, os eventos em que você entrou, os pontos visitados e as datas dos carimbos.
          Não pedimos nome completo, e-mail, telefone ou localização do celular.
        </p>
        <p>
          Se você avaliar um evento na aplicação, guardamos uma nota de 1 a 5 por evento. A
          organização consulta os resultados agregados. Seu apelido e quantidade de carimbos
          aparecem no ranking do evento.
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Neste dispositivo</h2>
        <p>
          Um cookie protegido reconhece seu passaporte por até um ano. O código de recuperação
          permite abrir o passaporte em outro dispositivo; guarde-o em um lugar privado.
        </p>
        <p>
          Quando não há conexão, este navegador guarda apenas os pontos que você tentou visitar e
          uma referência à sessão. Os carimbos são confirmados quando a conexão volta. Senhas,
          tokens de acesso e códigos de recuperação não ficam nessa fila.
        </p>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Fotos e compartilhamento</h2>
        <p>
          A foto opcional dos cards é processada no seu dispositivo e não é enviada ao servidor do
          passaporte. Você escolhe se quer baixar ou compartilhar a imagem.
        </p>
        <p>
          Formulários externos e redes sociais têm suas próprias regras de tratamento de dados. O
          passaporte não envia seu código de recuperação para esses serviços.
        </p>
      </section>
      <p>Para dúvidas ou solicitações sobre seu passaporte, procure a organização do evento.</p>
    </VisitorShell>
  )
}
